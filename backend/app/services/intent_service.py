import re
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.catalog import Product
from app.schemas.intent import StructuredIntent, CandidateEvaluation, EvaluationResponse

class IntentService:
    @staticmethod
    def parse_intent(query: str, max_budget_override: Optional[float] = None) -> StructuredIntent:
        """
        Parses natural language purchase queries into structured requirements.
        Uses intelligent semantic pattern recognition with fallback for robust execution.
        """
        lower_q = query.lower()
        
        # 1. Extract Price Limit
        extracted_max_price = max_budget_override
        if not extracted_max_price:
            price_patterns = [
                r'(?:under|below|less\s+than|max|budget\s+of|upto|up\s+to)\s*(?:rs\.?|inr|₹)?\s*([0-9]+(?:,[0-9]+)*)',
                r'(?:rs\.?|inr|₹)\s*([0-9]+(?:,[0-9]+)*)\s*(?:budget|max|or\s+less)',
                r'([0-9]+(?:,[0-9]+)*)\s*(?:rs|inr|rupees)'
            ]
            for pat in price_patterns:
                match = re.search(pat, lower_q)
                if match:
                    val_str = match.group(1).replace(",", "")
                    try:
                        extracted_max_price = float(val_str)
                        break
                    except ValueError:
                        pass

        # 2. Extract Quantity
        quantity = 1
        qty_match = re.search(r'(?:buy|purchase|need|order)\s+([0-9]+)\s+(?:units|items|pieces|of|monitors|headphones|keyboards|chargers)?', lower_q)
        if qty_match:
            try:
                quantity = int(qty_match.group(1))
            except ValueError:
                quantity = 1
        elif "two" in lower_q or " 2 " in lower_q or "2x" in lower_q:
            quantity = 2
        elif "three" in lower_q or " 3 " in lower_q or "3x" in lower_q:
            quantity = 3

        # 3. Extract Category & Target Product Type
        category = None
        target_product_type = "general"
        if any(w in lower_q for w in ["headphone", "headphones", "earbud", "earbuds", "earphones", "audio", "anc", "music"]):
            category = "Audio"
            target_product_type = "headphones" if "earbud" not in lower_q else "earbuds"
        elif any(w in lower_q for w in ["keyboard", "keyboards", "mouse", "mice", "peripheral", "clicky", "typing"]):
            category = "Peripherals"
            target_product_type = "keyboard" if "mouse" not in lower_q else "mouse"
        elif any(w in lower_q for w in ["monitor", "monitors", "screen", "screens", "display", "displays", "4k", "ultrawide", "qhd"]):
            category = "Electronics"
            target_product_type = "monitor"
        elif any(w in lower_q for w in ["charger", "chargers", "cable", "cables", "hub", "desk pad", "desk mat", "accessory", "accessories"]):
            category = "Accessories"
            target_product_type = "charger" if "charg" in lower_q else ("hub" if "hub" in lower_q or "dock" in lower_q else "cable")
        elif any(w in lower_q for w in ["voucher", "gift card", "cash card", "gift voucher"]):
            category = "Gift Cards"
            target_product_type = "gift_voucher"

        # 4. Extract Required / Preferred Features
        required_features = []
        if "gaming" in lower_q or "game" in lower_q or "gamer" in lower_q or "esports" in lower_q:
            required_features.append("gaming")
        if "anc" in lower_q or "noise cancel" in lower_q or "noise-cancelling" in lower_q:
            required_features.append("anc")
        if "battery" in lower_q or "long battery" in lower_q:
            required_features.append("battery_hours_min_25")
        if "wireless" in lower_q or "bluetooth" in lower_q:
            required_features.append("wireless")
        if "mechanical" in lower_q:
            required_features.append("mechanical")
        if "rgb" in lower_q:
            required_features.append("rgb")
        if "4k" in lower_q or "uhd" in lower_q:
            required_features.append("4k")
        if "fast charg" in lower_q or "gan" in lower_q:
            required_features.append("fast_charging")

        return StructuredIntent(
            category=category,
            target_product_type=target_product_type,
            max_price=extracted_max_price,
            quantity=quantity,
            required_features=required_features,
            attributes_preference={"query_keywords": [w for w in lower_q.split() if len(w) > 3]},
            urgency="standard",
            raw_query=query
        )

    @staticmethod
    def evaluate_candidates(db: Session, intent: StructuredIntent) -> EvaluationResponse:
        """
        Evaluates catalog against parsed intent and scores candidates deterministically.
        Strictly prioritizes products matching the target category and product type.
        """
        all_products = db.query(Product).all()
        candidates: List[CandidateEvaluation] = []

        max_budget = intent.max_price or 1000000.0

        for p in all_products:
            score = 0.0
            matched_features = []
            missing_features = []
            attrs = p.attributes or {}

            # 1. Strict Category & Product Type Alignment (40 pts)
            if intent.category:
                if p.category.lower() == intent.category.lower():
                    score += 35.0
                    matched_features.append(f"Category: {p.category}")
                    # Extra bonus if exact subtype matches
                    if intent.target_product_type != "general" and attrs.get("type") == intent.target_product_type:
                        score += 10.0
                else:
                    # Non-matching categories are strictly filtered out
                    continue
            else:
                score += 15.0 # Neutral

            # 2. Budget Compliance (25 pts)
            total_item_cost = p.price * intent.quantity
            in_budget = total_item_cost <= max_budget
            if in_budget:
                score += 25.0
                matched_features.append(f"₹{p.price:,.0f} within budget limit")
            else:
                missing_features.append(f"₹{p.price:,.0f} exceeds budget limit of ₹{max_budget:,.0f}")
                score -= 15.0

            # 3. Feature Matches (25 pts)
            for req in intent.required_features:
                if req == "gaming":
                    if attrs.get("gaming") is True or attrs.get("refresh_rate", 0) >= 120:
                        score += 15.0
                        matched_features.append(f"High-refresh gaming specs ({attrs.get('refresh_rate', '')}Hz)")
                    else:
                        missing_features.append("Standard 60Hz (non-gaming)")
                elif req == "anc":
                    if attrs.get("anc") is True:
                        score += 15.0
                        matched_features.append("Active Noise Cancellation (ANC)")
                    else:
                        missing_features.append("No ANC")
                elif req == "battery_hours_min_25":
                    hours = attrs.get("battery_hours", 0)
                    if hours >= 25:
                        score += 10.0
                        matched_features.append(f"{hours}h Battery Life (>=25h required)")
                    elif hours > 0:
                        score += 5.0
                        matched_features.append(f"{hours}h Battery Life")
                elif req == "wireless":
                    if attrs.get("wireless") is True:
                        score += 10.0
                        matched_features.append("Wireless connectivity")
                    else:
                        missing_features.append("Wired only")
                elif req == "mechanical":
                    if attrs.get("mechanical") is True or "mechanical" in p.name.lower():
                        score += 15.0
                        matched_features.append("Mechanical switches")
                elif req == "4k":
                    if "4k" in p.name.lower() or "4k" in str(attrs.get("resolution", "")).lower():
                        score += 15.0
                        matched_features.append("4K Ultra HD resolution")
                elif req == "fast_charging" or req == "gan":
                    if attrs.get("gan_tech") is True or attrs.get("fast_charging") is True:
                        score += 10.0
                        matched_features.append("Fast charging / GaN technology")

            # 4. Stock & Agent Purchase Status (10 pts)
            if p.stock > 0 and p.agent_purchasable:
                score += 10.0
                matched_features.append("In stock & AI-purchasable")
            else:
                if p.stock <= 0:
                    missing_features.append("Out of stock")
                    score -= 30.0
                if not p.agent_purchasable:
                    missing_features.append("Prohibited for autonomous agent purchase")
                    score -= 20.0

            # Deal tag bonus
            if attrs.get("deal_tag"):
                score += 5.0

            # Normalize Score to 0-100%
            final_match_percentage = max(5.0, min(99.0, round(score, 1)))

            candidates.append(
                CandidateEvaluation(
                    product_id=p.id,
                    product_name=p.name,
                    price=p.price,
                    stock=p.stock,
                    category=p.category,
                    match_score=final_match_percentage,
                    matched_features=matched_features,
                    missing_features=missing_features,
                    in_budget=in_budget,
                    agent_purchasable=p.agent_purchasable,
                    attributes=attrs,
                    trade_off_note=None
                )
            )

        # Sort descending by match score
        candidates.sort(key=lambda c: (c.match_score, -c.price), reverse=True)
        top_candidates = candidates[:3]

        selected_candidate = top_candidates[0] if top_candidates else None

        # Build trade-off explanation comparing within the same category
        trade_off_explanation = None
        if len(top_candidates) >= 2:
            first = top_candidates[0]
            second = top_candidates[1]
            price_diff = first.price - second.price
            if price_diff > 0:
                trade_off_explanation = f"₹{price_diff:,.0f} more than {second.product_name} (₹{second.price:,.0f}), but offers higher match specs ({first.match_score}% vs {second.match_score}%)."
            elif price_diff < 0:
                trade_off_explanation = f"₹{abs(price_diff):,.0f} less than {second.product_name} (₹{second.price:,.0f}) while maintaining top feature scores."
            else:
                trade_off_explanation = f"Same price as {second.product_name} (₹{second.price:,.0f}) with enhanced ratings."

        rationale_list = []
        if selected_candidate:
            rationale_list.append(f"Top pick: {selected_candidate.product_name} ({selected_candidate.match_score}% match at ₹{selected_candidate.price:,.0f}) based on category specifications.")

        return EvaluationResponse(
            structured_intent=intent,
            total_catalog_evaluated=len(all_products),
            top_candidates=top_candidates,
            selected_candidate=selected_candidate,
            selection_rationale=rationale_list,
            trade_off_explanation=trade_off_explanation
        )
