import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, Base, engine
from app.seed import seed_database

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()
    yield

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["product"] == "Anton — Agent Commerce Gateway"

def test_agent_readable_catalog_and_spec():
    # 1. Test regular catalog list
    res = client.get("/api/catalog")
    assert res.status_code == 200
    products = res.json()
    assert len(products) >= 10
    
    # Check SoundMax Pro attributes
    soundmax = next(p for p in products if p["id"] == "prod_soundmax_pro")
    assert soundmax["price"] == 4499.0
    assert soundmax["attributes"]["anc"] is True
    assert soundmax["agent_purchasable"] is True

    # 2. Test Agent Spec endpoint
    spec_res = client.get("/api/catalog/agent-spec")
    assert spec_res.status_code == 200
    spec = spec_res.json()
    assert spec["merchant_name"] == "Acme Electronics & Lifestyle"
    assert "endpoints" in spec
    assert "purchase_rules_summary" in spec

def test_intent_parsing_and_evaluation():
    # AI Query from PRD: "Find me the best ANC headphones under ₹5,000 and buy them"
    eval_res = client.post("/api/intent/evaluate", json={
        "query": "Find me the best ANC headphones under ₹5,000 with good battery life and buy them",
        "agent_id": "agent_42"
    })
    assert eval_res.status_code == 200
    data = eval_res.json()
    
    assert data["structured_intent"]["category"] == "Audio"
    assert data["structured_intent"]["max_price"] == 5000.0
    assert "anc" in data["structured_intent"]["required_features"]
    
    # Check candidates
    top = data["top_candidates"]
    assert len(top) >= 2
    assert top[0]["product_id"] in ["prod_soundmax_pro", "prod_boat_anc"]
    assert top[0]["match_score"] >= 80.0
    assert len(data["selection_rationale"]) > 0

def test_successful_mandate_approval_and_razorpay_flow():
    # 1. Create Mandate for 1x SoundMax Pro ANC (₹4,499)
    mandate_payload = {
        "agent_id": "agent_42",
        "product_id": "prod_soundmax_pro",
        "quantity": 1,
        "max_budget": 5000.0,
        "buyer_prompt": "ANC headphones under 5000",
        "products_evaluated_count": 12,
        "selection_rationale": ["₹4,499 within budget", "Active Noise Cancellation", "In stock"]
    }
    mandate_res = client.post("/api/mandates", json=mandate_payload)
    assert mandate_res.status_code == 200
    mandate_data = mandate_res.json()
    
    # 2. Verify Mandate Engine Approved it
    assert mandate_data["decision"] == "APPROVED"
    assert mandate_data["amount"] == 4499.0
    assert len(mandate_data["rules"]) >= 6
    for r in mandate_data["rules"]:
        assert r["passed"] is True

    mandate_id = mandate_data["mandate_id"]

    # 3. Create Razorpay order
    order_res = client.post("/api/payments/create-order", json={"mandate_id": mandate_id})
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert "order_id" in order_data
    assert order_data["amount"] == 4499.0

    # 4. Complete payment
    complete_res = client.post("/api/payments/complete", json={
        "mandate_id": mandate_id,
        "razorpay_order_id": order_data["order_id"],
        "razorpay_payment_id": "pay_test_soundmax_123"
    })
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "SUCCESS"

    # 5. Check Purchase Passport
    passport_res = client.get(f"/api/passport/{mandate_id}")
    assert passport_res.status_code == 200
    passport = passport_res.json()
    assert passport["product_name"] == "SoundMax Pro ANC Wireless Headphones"
    assert passport["amount"] == 4499.0
    assert passport["payment_status"] == "SUCCESS"
    assert len(passport["authorization_summary"]) >= 6

def test_blocked_purchase_spending_limit_exceeded():
    # Scenario B from PRD: Requesting 3x 4K Monitors (3 x ₹24,999 = ₹74,997), exceeding ₹50,000 limit
    mandate_payload = {
        "agent_id": "agent_42",
        "product_id": "prod_ultraview_4k",
        "quantity": 3,
        "max_budget": 80000.0,
        "buyer_prompt": "Buy three 4k monitors"
    }
    mandate_res = client.post("/api/mandates", json=mandate_payload)
    assert mandate_res.status_code == 200
    mandate_data = mandate_res.json()

    # Verify DECLINED by Mandate Engine
    assert mandate_data["decision"] == "DECLINED"
    assert "exceeds" in mandate_data["decision_reason"].lower()
    
    # Verify next options suggested
    assert len(mandate_data["next_options"]) > 0

    # Critical Security Guarantee: Attempting to create a Razorpay order MUST be rejected with 400
    order_res = client.post("/api/payments/create-order", json={"mandate_id": mandate_data["mandate_id"]})
    assert order_res.status_code == 400
    assert "only invoked for approved" in order_res.json()["detail"].lower()

    # Verify Decision Ledger contains the rejected entry
    ledger_res = client.get(f"/api/ledger/{mandate_data['mandate_id']}")
    assert ledger_res.status_code == 200
    entry = ledger_res.json()
    assert entry["decision"] == "DECLINED"
    assert entry["razorpay_called"] is False
    assert entry["payment_status"] == "NOT_INITIATED"

def test_agent_revocation_enforcement():
    # 1. Revoke agent_42
    revoke_res = client.post("/api/agents/agent_42/revoke", json={"reason": "Security protocol testing"})
    assert revoke_res.status_code == 200
    assert revoke_res.json()["status"] == "REVOKED"

    # 2. Attempt purchase with revoked agent
    mandate_payload = {
        "agent_id": "agent_42",
        "product_id": "prod_soundmax_pro",
        "quantity": 1,
        "max_budget": 5000.0,
        "buyer_prompt": "Buy SoundMax Pro headphones"
    }
    mandate_res = client.post("/api/mandates", json=mandate_payload)
    assert mandate_res.status_code == 200
    mandate_data = mandate_res.json()
    assert mandate_data["decision"] == "DECLINED"
    assert "revoked" in mandate_data["decision_reason"].lower()

    # 3. Restore agent
    restore_res = client.post("/api/agents/agent_42/restore")
    assert restore_res.status_code == 200
    assert restore_res.json()["status"] == "ACTIVE"

def test_policy_simulation_sandbox():
    sim_res = client.post("/api/policies/simulate", json={
        "agent_id": "agent_42",
        "product_id": "prod_voltlink_hub", # ₹2,499
        "quantity": 2,
        "custom_policy_override": {
            "max_autonomous_transaction_limit": 4000.0 # Limit 4k, total is 4998 -> should decline
        }
    })
    assert sim_res.status_code == 200
    data = sim_res.json()
    assert data["overall_decision"] == "DECLINED"
    assert len(data["rules"]) >= 5

def test_conversational_chat_agent():
    # Turn 1: Initial query
    res1 = client.post("/api/chat", json={
        "session_id": "test_session_1",
        "message": "Find me ANC headphones under 5000",
        "agent_id": "agent_42",
        "history": []
    })
    assert res1.status_code == 200
    data1 = res1.json()
    assert "Boat Nirvana" in data1["reply"] or data1["candidate_evaluation"] is not None

    # Turn 2: Follow-up purchase confirmation
    res2 = client.post("/api/chat", json={
        "session_id": "test_session_1",
        "message": "Yes, buy it",
        "agent_id": "agent_42",
        "history": [
            {"role": "user", "content": "Find me ANC headphones under 5000"},
            {"role": "assistant", "content": data1["reply"], "candidate_evaluation": data1["candidate_evaluation"]}
        ]
    })
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["mandate_proposal"] is not None

def test_conversational_guardrails():
    # 1. Who are you / greeting
    res_who = client.post("/api/chat", json={
        "message": "who are you?",
        "history": []
    })
    assert res_who.status_code == 200
    assert "Autonomous Procurement Assistant" in res_who.json()["reply"]

    # 2. Math rejection (2+2)
    res_math = client.post("/api/chat", json={
        "message": "what is 2+2?",
        "history": []
    })
    assert res_math.status_code == 200
    assert "cannot assist with general calculations" in res_math.json()["reply"]

    # 3. Coding rejection
    res_code = client.post("/api/chat", json={
        "message": "write code in python to reverse a string",
        "history": []
    })
    assert res_code.status_code == 200
    assert "cannot assist with general calculations" in res_code.json()["reply"]
