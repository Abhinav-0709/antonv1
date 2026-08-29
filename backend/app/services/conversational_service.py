import json
import re
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.catalog import Product
from app.schemas.chat import ChatMessage, ChatRequest, ChatResponse
from app.schemas.intent import StructuredIntent, EvaluationResponse
from app.services.intent_service import IntentService

class ConversationalService:
    @staticmethod
    def process_chat_turn(db: Session, request: ChatRequest) -> ChatResponse:
        """
        Processes multi-turn conversational queries strictly within the procurement & commerce domain.
        - Handles greetings and self-introduction.
        - Strict guardrails: Refuses general trivia, math (e.g. 2+2), coding, and off-topic questions.
        - Provides purchasing assistance, catalog discovery, policy evaluations, and mandate proposals.
        """
        user_message = request.message.strip()
        clean_msg = re.sub(r'[^\w\s\+\-\*\/\=]', '', user_message.lower()).strip()
        history = request.history or []

        # 1. Handle Greetings & Self-Introduction ("who are you", "what are you", "who r u", "hi", etc.)
        greeting_patterns = [
            "hi", "hello", "hey", "hola", "greetings", "start", "good morning", "good evening", "sup"
        ]
        intro_patterns = [
            "who are you", "who r u", "who r you", "what are you", "what r u", "what r you", 
            "what is your name", "who made you", "what do you do", "introduce yourself", "who is this"
        ]

        if clean_msg in greeting_patterns or any(p in clean_msg for p in intro_patterns):
            return ChatResponse(
                session_id=request.session_id or "session_default",
                reply="👋 Hello! I am your **Autonomous Procurement Assistant** powered by Anton.\n\nI am exclusively designed to assist you with finding products in our merchant catalog, evaluating specifications, and creating policy-bounded purchase mandates with Razorpay settlement.\n\nHow can I help you shop today? (e.g. *'ANC headphones under ₹5,000'*, *'3x 4K Monitors'*, or *'Fast charger'*).",
                suggested_actions=[
                    "ANC Headphones under ₹5k",
                    "3x 4K UHD Monitors",
                    "GaN Fast Charger under ₹3k",
                    "Mechanical Keyboard"
                ]
            )

        # 2. Strict Domain Guardrails: Reject Math, Code, General Trivia, Weather, Jokes
        math_pattern = r'([0-9]+\s*[\+\-\*\/\^]\s*[0-9]+|\bcalculate\b|\bmath\b|\bsolve\b|\bplus\b|\bminus\b|\bdivided\b|\bmultiply\b|\bequation\b)'
        code_keywords = ["write code", "python", "javascript", "typescript", "c++", "java", "sql", "html", "css", "function", "debug", "algorithm", "regex", "script", "coding", "loop", "variable", "syntax"]
        trivia_keywords = ["weather", "capital of", "tell me a joke", "write a poem", "story", "who is the president", "who won", "recipe", "news", "translate", "essay"]

        is_math = bool(re.search(math_pattern, clean_msg)) or "2+2" in user_message or "2 + 2" in user_message
        is_code = any(k in clean_msg for k in code_keywords)
        is_trivia = any(k in clean_msg for k in trivia_keywords)

        if is_math or is_code or is_trivia:
            return ChatResponse(
                session_id=request.session_id or "session_default",
                reply="🛡️ I am Anton's **Autonomous Procurement Assistant**, designed strictly for **product discovery, merchant policy evaluation, and safe Razorpay commerce**.\n\nI cannot assist with general calculations, coding requests, or general trivia. How can I help you find and purchase items from our catalog?",
                suggested_actions=[
                    "ANC Headphones under ₹5k",
                    "3x 4K UHD Monitors",
                    "GaN Fast Charger under ₹3k",
                    "Mechanical Keyboard"
                ]
            )

        # 3. Handle System / Commerce Educational Questions
        if any(w in clean_msg for w in ["how does this work", "how it works", "what is anton", "what can you do", "help", "explain gateway"]):
            return ChatResponse(
                session_id=request.session_id or "session_default",
                reply="🛡️ **How Anton Works**:\n\n1. **AI Proposes**: You describe what you need in natural language. I scan the live catalog and select the best candidate.\n2. **Policy Decides**: The mandate is evaluated against strict merchant rules (spending caps, allowed categories, agent status). LLMs have 0% financial authority.\n3. **Razorpay Executes**: Payment is captured only if authorized.\n4. **Purchase Passport**: You receive a verifiable receipt with selection rationale.\n\nTry asking for a product like *'ANC headphones under ₹5,000'* or click a scenario above!",
                suggested_actions=[
                    "ANC Headphones under ₹5k",
                    "3x 4K UHD Monitors",
                    "Prohibited Category (Gift Voucher)",
                    "Revoked Agent Access (agent_rogue)"
                ]
            )

        if "category" in clean_msg or "categories" in clean_msg or "catalog" in clean_msg:
            return ChatResponse(
                session_id=request.session_id or "session_default",
                reply="📦 **Available Merchant Categories**:\n\n• **Audio**: ANC Wireless Headphones, Earbuds\n• **Electronics**: 4K UHD UltraFine Displays\n• **Peripherals**: Mechanical Wireless Keyboards, Ergonomic Mice\n• **Accessories**: GaN Fast Chargers, Braided USB-C Cables, Desk Pads\n• **Prohibited (Policy Blocked)**: Gift Vouchers / Cash Cards\n\nWhat would you like to explore?",
                suggested_actions=[
                    "Show ANC Headphones",
                    "Show 4K Monitors",
                    "Show Keyboards",
                    "Show Fast Chargers"
                ]
            )

        # 4. Check if user is confirming purchase of a previously evaluated candidate
        is_confirmation = any(w in clean_msg for w in ["buy it", "proceed", "authorize", "checkout", "confirm", "order it", "purchase it", "yes please", "yes buy", "yes do it", "yes"])
        
        last_eval: Optional[EvaluationResponse] = None
        for msg in reversed(history):
            if msg.candidate_evaluation and msg.candidate_evaluation.selected_candidate:
                last_eval = msg.candidate_evaluation
                break

        if is_confirmation and last_eval and last_eval.selected_candidate:
            sel = last_eval.selected_candidate
            mandate_proposal = {
                "agent_id": request.agent_id,
                "product_id": sel.product_id,
                "product_name": sel.product_name,
                "price": sel.price,
                "quantity": last_eval.structured_intent.quantity or 1,
                "total_amount": sel.price * (last_eval.structured_intent.quantity or 1),
                "buyer_prompt": user_message
            }

            return ChatResponse(
                session_id=request.session_id or "session_default",
                reply=f"🎯 Perfect! I have prepared the purchase mandate for **{sel.product_name}** (₹{sel.price:,.0f}). Click **Authorize Mandate** below to run it through the merchant policy engine.",
                candidate_evaluation=last_eval,
                mandate_proposal=mandate_proposal,
                suggested_actions=["Authorize Mandate", "Change Quantity", "Show alternatives"]
            )

        # 5. Aggregate query context from history for product searches
        user_queries = [m.content for m in history if m.role == "user"]
        user_queries.append(user_message)
        combined_context = " ".join(user_queries[-2:])

        # Parse intent
        intent = IntentService.parse_intent(user_message)
        if not intent.category and len(user_queries) > 1:
            intent = IntentService.parse_intent(combined_context)

        # Check for specific modifier in this turn
        turn_intent = IntentService.parse_intent(user_message)
        if turn_intent.max_price:
            intent.max_price = turn_intent.max_price
        if turn_intent.quantity > 1:
            intent.quantity = turn_intent.quantity

        # Check if query is just a generic question with no product keywords
        product_keywords = ["headphone", "headphones", "earbud", "audio", "anc", "monitor", "display", "screen", "keyboard", "mouse", "charger", "cable", "voucher", "gift", "pad", "desk", "buy", "purchase", "need", "find", "order", "want", "under", "₹", "rs", "inr"]
        has_product_intent = any(k in clean_msg for k in product_keywords)

        if not has_product_intent and not intent.category:
            return ChatResponse(
                session_id=request.session_id or "session_default",
                reply=f"I can help you shop for items in our catalog! Could you specify what product or category you are looking for? (e.g. **ANC headphones**, **4K monitors**, **keyboards**, or **chargers**).",
                suggested_actions=[
                    "ANC Headphones under ₹5k",
                    "3x 4K UHD Monitors",
                    "GaN Fast Charger under ₹3k",
                    "Mechanical Keyboard"
                ]
            )

        # 6. Evaluate Catalog Candidates
        evaluation = IntentService.evaluate_candidates(db, intent)

        if not evaluation.selected_candidate and len(evaluation.top_candidates) == 0:
            return ChatResponse(
                session_id=request.session_id or "session_default",
                reply=f"I searched the merchant catalog for *'{user_message}'*, but couldn't find an exact match under your criteria. Would you like to adjust your budget or search a different category?",
                suggested_actions=[
                    "ANC Headphones under ₹5k",
                    "3x 4K UHD Monitors",
                    "Mechanical Keyboard",
                    "GaN Fast Charger under ₹3k"
                ]
            )

        top = evaluation.selected_candidate
        reply_lines = []
        if top:
            reply_lines.append(f"🔍 I scanned **{evaluation.total_catalog_evaluated} catalog items** and found **{len(evaluation.top_candidates)} strong matches**.")
            reply_lines.append(f"My top recommendation is **{top.product_name}** at **₹{top.price:,.0f}** ({top.match_score}% match).")
            if evaluation.trade_off_explanation:
                reply_lines.append(f"💡 *Trade-off:* {evaluation.trade_off_explanation}")
            reply_lines.append("Click **Authorize Mandate** below to evaluate merchant policies and execute Razorpay settlement.")

        reply_text = "\n\n".join(reply_lines)

        mandate_proposal = None
        if top:
            mandate_proposal = {
                "agent_id": request.agent_id,
                "product_id": top.product_id,
                "product_name": top.product_name,
                "price": top.price,
                "quantity": intent.quantity or 1,
                "total_amount": top.price * (intent.quantity or 1),
                "buyer_prompt": user_message
            }

        return ChatResponse(
            session_id=request.session_id or "session_default",
            reply=reply_text,
            candidate_evaluation=evaluation,
            mandate_proposal=mandate_proposal,
            suggested_actions=["Authorize Mandate", "Change Quantity", "Show alternatives"]
        )
