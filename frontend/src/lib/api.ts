const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  category: string;
  attributes: Record<string, any>;
  agent_purchasable: boolean;
  requires_human_confirmation: boolean;
  max_quantity_per_agent_order: number;
  image_url?: string;
  deal_tag?: string;
  original_price?: number;
  discount_percent?: number;
}

export interface AgentSpec {
  merchant_name: string;
  currency: string;
  protocol_version: string;
  endpoints: Record<string, string>;
  purchase_rules_summary: Record<string, any>;
  products: Product[];
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "REVOKED" | "SUSPENDED";
  trust_tier: string;
  max_transaction_limit: number;
  daily_spend_limit: number;
  spent_today: number;
  allowed_categories: string[];
  revoked_at?: string;
  revocation_reason?: string;
}

export interface MerchantPolicy {
  id: string;
  merchant_name: string;
  max_autonomous_transaction_limit: number;
  daily_spend_limit_per_agent: number;
  human_approval_threshold: number;
  max_quantity_per_order: number;
  allowed_categories: string[];
  blocked_categories: string[];
  require_verified_agent: boolean;
  allow_autonomous_checkout: boolean;
}

export interface CandidateEvaluation {
  product_id: string;
  product_name: string;
  price: number;
  stock: number;
  category: string;
  match_score: number;
  matched_features: string[];
  missing_features: string[];
  in_budget: boolean;
  agent_purchasable: boolean;
  trade_off_note?: string;
  attributes: Record<string, any>;
  deal_tag?: string;
  original_price?: number;
  discount_percent?: number;
}

export interface EvaluationResponse {
  structured_intent: {
    category?: string;
    target_product_type: string;
    max_price?: number;
    quantity: number;
    required_features: string[];
    attributes_preference: Record<string, any>;
    raw_query: string;
  };
  total_catalog_evaluated: number;
  top_candidates: CandidateEvaluation[];
  selected_candidate?: CandidateEvaluation;
  selection_rationale: string[];
  trade_off_explanation?: string;
}

export interface MandateRuleEvaluation {
  rule: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface MandateEvaluationResult {
  mandate_id: string;
  decision: "APPROVED" | "DECLINED" | "HUMAN_APPROVAL_REQUIRED";
  decision_reason: string;
  rules: MandateRuleEvaluation[];
  amount: number;
  product_name: string;
  next_options: string[];
  suggested_alternative_product_id?: string;
}

export interface DecisionLedgerEntry {
  id: string;
  mandate_id: string;
  agent_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  amount: number;
  currency: string;
  buyer_prompt?: string;
  products_evaluated_count: number;
  top_candidates: any[];
  selection_rationale: string[];
  trade_off?: string;
  rules_evaluated: MandateRuleEvaluation[];
  decision: "APPROVED" | "DECLINED" | "HUMAN_APPROVAL_REQUIRED";
  decision_reason: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_status: string;
  razorpay_called: boolean;
  created_at: string;
}

export interface LedgerSummaryStats {
  total_decisions: number;
  approved_count: number;
  declined_count: number;
  human_approval_count: number;
  total_transacted_volume: number;
  active_agents_count: number;
}

export interface PurchasePassport {
  passport_id: string;
  transaction_id: string;
  product_name: string;
  amount: number;
  currency: string;
  buyer_request: string;
  products_evaluated_count: number;
  top_candidates: {
    product_id: string;
    name: string;
    price: number;
    match_score: number;
  }[];
  why_selected: string[];
  trade_offs?: string;
  authorization_summary: {
    label: string;
    description: string;
    status: string;
  }[];
  payment_status: string;
  payment_method: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  timestamp: string;
  merchant_name: string;
}

// API methods
export const api = {
  // Catalog
  getCatalog: async (): Promise<Product[]> => {
    const res = await fetch(`${API_BASE}/catalog`);
    return res.json();
  },
  getAgentSpec: async (): Promise<AgentSpec> => {
    const res = await fetch(`${API_BASE}/catalog/agent-spec`);
    return res.json();
  },

  // Intent & Evaluation
  evaluateIntent: async (query: string, agent_id = "agent_42", max_budget?: number): Promise<EvaluationResponse> => {
    const res = await fetch(`${API_BASE}/intent/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, agent_id, max_budget }),
    });
    return res.json();
  },

  // Mandate Engine
  createAndEvaluateMandate: async (payload: {
    agent_id: string;
    product_id: string;
    quantity: number;
    max_budget: number;
    buyer_prompt?: string;
    structured_intent?: any;
    products_evaluated_count?: number;
    top_candidates?: any[];
    selection_rationale?: string[];
    trade_off?: string;
  }): Promise<MandateEvaluationResult> => {
    const res = await fetch(`${API_BASE}/mandates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Razorpay Payments
  createRazorpayOrder: async (mandate_id: string) => {
    const res = await fetch(`${API_BASE}/payments/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mandate_id }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create Razorpay order");
    }
    return res.json();
  },
  completePayment: async (payload: {
    mandate_id: string;
    razorpay_order_id: string;
    razorpay_payment_id?: string;
    simulate_failure?: boolean;
  }) => {
    const res = await fetch(`${API_BASE}/payments/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Ledger & Passport
  getLedger: async (params?: { agent_id?: string; decision?: string; limit?: number; offset?: number }): Promise<DecisionLedgerEntry[]> => {
    const searchParams = new URLSearchParams();
    if (params?.agent_id) searchParams.append("agent_id", params.agent_id);
    if (params?.decision) searchParams.append("decision", params.decision);
    if (params?.limit !== undefined) searchParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) searchParams.append("offset", params.offset.toString());
    const res = await fetch(`${API_BASE}/ledger?${searchParams.toString()}`);
    return res.json();
  },
  getLedgerStats: async (): Promise<LedgerSummaryStats> => {
    const res = await fetch(`${API_BASE}/ledger/stats`);
    return res.json();
  },
  getDecisionDetail: async (id: string): Promise<DecisionLedgerEntry> => {
    const res = await fetch(`${API_BASE}/ledger/${id}`);
    return res.json();
  },
  getPassport: async (transaction_id: string): Promise<PurchasePassport> => {
    const res = await fetch(`${API_BASE}/passport/${transaction_id}`);
    return res.json();
  },

  // Agents & Revocation
  getAgents: async (): Promise<Agent[]> => {
    const res = await fetch(`${API_BASE}/agents`);
    return res.json();
  },
  revokeAgent: async (agent_id: string, reason: string): Promise<Agent> => {
    const res = await fetch(`${API_BASE}/agents/${agent_id}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return res.json();
  },
  restoreAgent: async (agent_id: string): Promise<Agent> => {
    const res = await fetch(`${API_BASE}/agents/${agent_id}/restore`, {
      method: "POST",
    });
    return res.json();
  },

  // Policy & Simulation
  getPolicy: async (): Promise<MerchantPolicy> => {
    const res = await fetch(`${API_BASE}/policies`);
    return res.json();
  },
  updatePolicy: async (update: Partial<MerchantPolicy>): Promise<MerchantPolicy> => {
    const res = await fetch(`${API_BASE}/policies`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    return res.json();
  },
  simulatePolicy: async (payload: {
    agent_id: string;
    product_id: string;
    quantity: number;
    custom_policy_override?: any;
  }) => {
    const res = await fetch(`${API_BASE}/policies/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Conversational Chat API
  sendChatMessage: async (payload: {
    session_id?: string;
    message: string;
    agent_id?: string;
    history?: {
      role: string;
      content: string;
      candidate_evaluation?: EvaluationResponse | null;
      mandate_proposal?: any;
      passport_data?: PurchasePassport | null;
    }[];
  }): Promise<{
    session_id: string;
    reply: string;
    candidate_evaluation?: EvaluationResponse | null;
    mandate_proposal?: any;
    suggested_actions?: string[];
  }> => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
