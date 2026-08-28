from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models import Product, MerchantPolicy, Agent, Mandate, DecisionLedger

def seed_database(db: Session):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # 1. Seed Merchant Policy
    existing_policy = db.query(MerchantPolicy).filter(MerchantPolicy.id == "default_policy").first()
    if not existing_policy:
        policy = MerchantPolicy(
            id="default_policy",
            merchant_name="Acme Electronics & Lifestyle",
            max_autonomous_transaction_limit=50000.0,
            daily_spend_limit_per_agent=100000.0,
            human_approval_threshold=50000.0,
            max_quantity_per_order=3,
            allowed_categories=["Electronics", "Audio", "Accessories", "Peripherals"],
            blocked_categories=["Gift Cards", "Subscriptions", "Pre-orders", "Enterprise Hardware"],
            require_verified_agent=True,
            allow_autonomous_checkout=True
        )
        db.add(policy)

    # 2. Seed Agents
    seed_agents = [
        Agent(
            id="agent_42",
            name="Autonomous Buyer Agent 42",
            description="Primary autonomous procurement agent for consumer electronics & peripherals",
            status="ACTIVE",
            trust_tier="VERIFIED",
            max_transaction_limit=50000.0,
            daily_spend_limit=100000.0,
            spent_today=0.0,
            allowed_categories=["Electronics", "Audio", "Accessories", "Peripherals"]
        ),
        Agent(
            id="agent_scout",
            name="Scout Procurement Bot",
            description="Rapid deal finding and purchasing agent",
            status="ACTIVE",
            trust_tier="VERIFIED",
            max_transaction_limit=30000.0,
            daily_spend_limit=60000.0,
            spent_today=0.0,
            allowed_categories=["Audio", "Accessories"]
        ),
        Agent(
            id="agent_procure",
            name="Office Ops Agent",
            description="Standard tier office supply purchasing agent",
            status="ACTIVE",
            trust_tier="STANDARD",
            max_transaction_limit=25000.0,
            daily_spend_limit=50000.0,
            spent_today=0.0,
            allowed_categories=["Peripherals", "Accessories"]
        ),
        Agent(
            id="agent_rogue",
            name="Legacy Unverified Agent",
            description="Suspended agent due to anomalous high-frequency requests",
            status="REVOKED",
            trust_tier="PROBATIONARY",
            max_transaction_limit=10000.0,
            daily_spend_limit=20000.0,
            spent_today=0.0,
            allowed_categories=["Electronics"],
            revocation_reason="Revoked by merchant security audit: anomalous burst velocity"
        )
    ]

    for ag in seed_agents:
        existing_ag = db.query(Agent).filter(Agent.id == ag.id).first()
        if not existing_ag:
            db.add(ag)

    # 3. Seed Products (5-6 products per category for comprehensive discovery)
    seed_products = [
        # === AUDIO (5 Products) ===
        Product(
            id="prod_boat_anc",
            name="Boat Nirvana 751 ANC Wireless",
            description="Premium active noise cancelling over-ear headphones with 65h battery life and ASAP fast charge.",
            price=3999.0,
            currency="INR",
            stock=14,
            category="Audio",
            attributes={
                "type": "headphones",
                "subtype": "over-ear",
                "anc": True,
                "battery_hours": 65,
                "wireless": True,
                "gaming": False,
                "rating": 4.7,
                "deal_tag": "⚡ ₹500 OFF with AGENT500",
                "original_price": 4499.0,
                "discount_percent": 11
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_soundmax_pro",
            name="SoundMax Pro ANC Wireless Headphones",
            description="High-end noise cancelling headphones with 32h battery life and multipoint Bluetooth 5.3.",
            price=4499.0,
            currency="INR",
            stock=18,
            category="Audio",
            attributes={
                "type": "headphones",
                "subtype": "over-ear",
                "anc": True,
                "battery_hours": 32,
                "wireless": True,
                "gaming": False,
                "rating": 4.8,
                "deal_tag": "🔥 Agent Flash Deal: 10% Off",
                "original_price": 4999.0,
                "discount_percent": 10
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=2
        ),
        Product(
            id="prod_sonic_studio_max",
            name="SonicPro Studio Max Hi-Res ANC Headphones",
            description="Audiophile studio headphones with 45mm custom drivers, active noise cancellation, and LDAC audio codec.",
            price=8499.0,
            currency="INR",
            stock=8,
            category="Audio",
            attributes={
                "type": "headphones",
                "subtype": "over-ear",
                "anc": True,
                "battery_hours": 40,
                "wireless": True,
                "gaming": False,
                "rating": 4.9,
                "deal_tag": "👑 Audiophile Choice",
                "original_price": 9999.0,
                "discount_percent": 15
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=2
        ),
        Product(
            id="prod_aerobuds_pro",
            name="AeroBuds Pro Active Spatial Earbuds",
            description="Compact wireless earbuds with 32dB active noise cancellation, spatial audio tracking, and wireless charging case.",
            price=4999.0,
            currency="INR",
            stock=22,
            category="Audio",
            attributes={
                "type": "earbuds",
                "subtype": "in-ear",
                "anc": True,
                "battery_hours": 30,
                "wireless": True,
                "gaming": False,
                "rating": 4.6,
                "deal_tag": "✨ Free Silicone Case",
                "original_price": 5499.0,
                "discount_percent": 9
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_hyperbeat_gaming",
            name="HyperBeat 7.1 Surround Gaming Headset",
            description="Ultra-low latency wireless gaming headset with 7.1 virtual surround sound, detachable boom microphone, and RGB lighting.",
            price=3499.0,
            currency="INR",
            stock=15,
            category="Audio",
            attributes={
                "type": "headphones",
                "subtype": "over-ear",
                "anc": False,
                "battery_hours": 28,
                "wireless": True,
                "gaming": True,
                "rating": 4.7,
                "deal_tag": "🎮 Gamer Special: 15% Off",
                "original_price": 3999.0,
                "discount_percent": 12
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),

        # === ELECTRONICS / MONITORS (5 Products) ===
        Product(
            id="prod_swiftstrike_gaming",
            name="SwiftStrike 27-inch 240Hz QHD Gaming Monitor",
            description="Elite competitive gaming monitor featuring 240Hz refresh rate, 1ms Fast IPS response time, G-Sync compatibility, and HDR400.",
            price=29999.0,
            currency="INR",
            stock=10,
            category="Electronics",
            attributes={
                "type": "monitor",
                "size_inches": 27,
                "resolution": "2560x1440 QHD",
                "refresh_rate": 240,
                "response_time": "1ms",
                "gaming": True,
                "panel": "Fast IPS",
                "rating": 4.9,
                "deal_tag": "⚡ Free HDMI 2.1 Cable Included",
                "original_price": 34999.0,
                "discount_percent": 14
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_gamezone_esports",
            name="GameZone 24-inch 165Hz eSports Monitor",
            description="High-speed 165Hz Full HD gaming monitor with 0.5ms MPRT, AMD FreeSync Premium, and frameless bezels for esports setups.",
            price=14999.0,
            currency="INR",
            stock=16,
            category="Electronics",
            attributes={
                "type": "monitor",
                "size_inches": 24,
                "resolution": "1920x1080 FHD",
                "refresh_rate": 165,
                "response_time": "0.5ms",
                "gaming": True,
                "panel": "Fast IPS",
                "rating": 4.7,
                "deal_tag": "🎯 Best Budget Gaming Pick",
                "original_price": 17999.0,
                "discount_percent": 16
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_ultraview_4k",
            name="UltraView 27-inch 4K UHD Monitor",
            description="Crisp 3840x2160 IPS display with 99% sRGB color gamut, USB-C 65W power delivery, and height-adjustable stand.",
            price=24999.0,
            currency="INR",
            stock=12,
            category="Electronics",
            attributes={
                "type": "monitor",
                "size_inches": 27,
                "resolution": "3840x2160 4K UHD",
                "refresh_rate": 60,
                "response_time": "5ms",
                "gaming": False,
                "panel": "IPS",
                "rating": 4.8,
                "deal_tag": "💼 Ideal Productivity Display",
                "original_price": 27999.0,
                "discount_percent": 11
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_horizon_curved",
            name="HorizonWide 34-inch Curved Ultrawide Monitor",
            description="Immersive 21:9 WQHD 1500R curved gaming and multitasking monitor with 144Hz refresh rate, HDR10, and dual HDMI 2.0.",
            price=42999.0,
            currency="INR",
            stock=6,
            category="Electronics",
            attributes={
                "type": "monitor",
                "size_inches": 34,
                "resolution": "3440x1440 WQHD",
                "refresh_rate": 144,
                "response_time": "1ms",
                "gaming": True,
                "panel": "VA Curved",
                "rating": 4.8,
                "deal_tag": "🔥 Ultrawide Immersion",
                "original_price": 47999.0,
                "discount_percent": 10
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=2
        ),
        Product(
            id="prod_clarity_studio",
            name="ClarityCraft 32-inch 4K Pro Color Studio Display",
            description="Professional creator display with 99% DCI-P3 color accuracy, factory calibrated Delta E < 2, HDR600, and 90W Thunderbolt 4.",
            price=49999.0,
            currency="INR",
            stock=5,
            category="Electronics",
            attributes={
                "type": "monitor",
                "size_inches": 32,
                "resolution": "3840x2160 4K UHD",
                "refresh_rate": 60,
                "response_time": "4ms",
                "gaming": False,
                "panel": "IPS Black",
                "rating": 4.9,
                "deal_tag": "🎨 Creator Grade Precision",
                "original_price": 54999.0,
                "discount_percent": 9
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=2
        ),

        # === PERIPHERALS (5 Products) ===
        Product(
            id="prod_apexpro_keyboard",
            name="ApexPro Wireless Mechanical Keyboard",
            description="Hot-swappable mechanical gaming and typing keyboard with custom pre-lubed linear switches, per-key RGB, and PBT keycaps.",
            price=6499.0,
            currency="INR",
            stock=20,
            category="Peripherals",
            attributes={
                "type": "keyboard",
                "switches": "Gateron Red Linear",
                "mechanical": True,
                "wireless": True,
                "rgb": True,
                "gaming": True,
                "rating": 4.8,
                "deal_tag": "✨ Free Memory Foam Wrist Rest",
                "original_price": 7299.0,
                "discount_percent": 11
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_stealthtype_75",
            name="StealthType Compact 75% Silent Keyboard",
            description="Ultra-quiet compact mechanical keyboard with sound-dampening foam, silent tactile switches, and multi-device Bluetooth.",
            price=4299.0,
            currency="INR",
            stock=14,
            category="Peripherals",
            attributes={
                "type": "keyboard",
                "switches": "Silent Tactile",
                "mechanical": True,
                "wireless": True,
                "rgb": False,
                "gaming": False,
                "rating": 4.7,
                "deal_tag": "🤫 Ultra-Quiet Office Pick",
                "original_price": 4999.0,
                "discount_percent": 14
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_precision_mouse",
            name="PrecisionGlide Wireless Ergonomic Mouse",
            description="Sculpted ergonomic vertical mouse with silent switches, 4000 DPI sensor, and smart hyper-fast scroll wheel.",
            price=2199.0,
            currency="INR",
            stock=25,
            category="Peripherals",
            attributes={
                "type": "mouse",
                "wireless": True,
                "dpi": 4000,
                "ergonomic": True,
                "gaming": False,
                "rating": 4.6,
                "deal_tag": "🖱️ Best Ergonomic Mouse",
                "original_price": 2599.0,
                "discount_percent": 15
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_speedtrack_mouse",
            name="SpeedTrack 54g Ultra-Light Gaming Mouse",
            description="Featherlight 54g honeycomb gaming mouse with 26,000 DPI optical sensor, optical switches, and pure PTFE feet.",
            price=3299.0,
            currency="INR",
            stock=18,
            category="Peripherals",
            attributes={
                "type": "mouse",
                "wireless": True,
                "dpi": 26000,
                "gaming": True,
                "weight_g": 54,
                "rating": 4.9,
                "deal_tag": "⚡ Esports Grade 54g",
                "original_price": 3799.0,
                "discount_percent": 13
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_protypist_full",
            name="ProTypist Full-Size Wireless Keyboard",
            description="Full-size slim membrane keyboard with integrated numeric keypad, whisper-quiet keys, and 24-month battery life.",
            price=1799.0,
            currency="INR",
            stock=30,
            category="Peripherals",
            attributes={
                "type": "keyboard",
                "mechanical": False,
                "wireless": True,
                "full_size": True,
                "gaming": False,
                "rating": 4.5,
                "deal_tag": "🔋 24-Month Battery Life",
                "original_price": 2199.0,
                "discount_percent": 18
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),

        # === ACCESSORIES (5 Products) ===
        Product(
            id="prod_voltlink_hub",
            name="VoltLink 100W 4-Port GaN Charging Station",
            description="Compact 100W GaN desktop power station with 3x USB-C Power Delivery 3.0 ports and 1x USB-A Quick Charge 4.0 port.",
            price=2499.0,
            currency="INR",
            stock=25,
            category="Accessories",
            attributes={
                "type": "charger",
                "gan_tech": True,
                "total_wattage": 100,
                "ports": 4,
                "fast_charging": True,
                "rating": 4.8,
                "deal_tag": "⚡ Fast Charge Multi-Pack",
                "original_price": 2999.0,
                "discount_percent": 17
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_novacharge_65",
            name="NovaCharge 65W GaN Travel Charger",
            description="Ultra-compact pocket charger with foldable prongs, dual USB-C ports, and intelligent power distribution for laptops and phones.",
            price=1899.0,
            currency="INR",
            stock=35,
            category="Accessories",
            attributes={
                "type": "charger",
                "gan_tech": True,
                "total_wattage": 65,
                "ports": 2,
                "fast_charging": True,
                "rating": 4.7,
                "deal_tag": "✈️ Travel Essential",
                "original_price": 2299.0,
                "discount_percent": 17
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_omnidock_9in1",
            name="OmniDock 9-in-1 Aluminum USB-C Hub",
            description="Heavy-duty aluminum multiport hub with 4K 60Hz HDMI, 100W Power Delivery passthrough, Gigabit Ethernet, SD card reader, and 3x USB 3.2.",
            price=3799.0,
            currency="INR",
            stock=14,
            category="Accessories",
            attributes={
                "type": "hub",
                "ports": 9,
                "hdmi_4k": True,
                "power_delivery": "100W",
                "rating": 4.8,
                "deal_tag": "💻 Complete Workstation Dock",
                "original_price": 4299.0,
                "discount_percent": 12
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=2
        ),
        Product(
            id="prod_powerweave_cable",
            name="PowerWeave 240W Braided USB-C Cable (2-Pack)",
            description="Durable double-braided nylon 2-meter USB-C to USB-C cables with E-Marker smart chip and 240W Power Delivery 3.1 support.",
            price=899.0,
            currency="INR",
            stock=45,
            category="Accessories",
            attributes={
                "type": "cable",
                "length_m": 2,
                "wattage": 240,
                "braided": True,
                "rating": 4.9,
                "deal_tag": "🛡️ Lifetime Breakage Warranty",
                "original_price": 1199.0,
                "discount_percent": 25
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),
        Product(
            id="prod_luxedesk_mat",
            name="LuxeDesk Leatherette XL Desk Mat (90x40cm)",
            description="Premium waterproof and stain-resistant faux leather desk pad with non-slip natural suede base.",
            price=1199.0,
            currency="INR",
            stock=28,
            category="Accessories",
            attributes={
                "type": "desk_mat",
                "size": "90x40cm",
                "waterproof": True,
                "rating": 4.6,
                "deal_tag": "⭐ Desk Aesthetic Choice",
                "original_price": 1499.0,
                "discount_percent": 20
            },
            agent_purchasable=True,
            requires_human_confirmation=False,
            max_quantity_per_agent_order=3
        ),

        # === PROHIBITED / GIFT VOUCHERS (2 Products) ===
        Product(
            id="prod_acme_voucher_50k",
            name="Acme Corporate Digital Gift Voucher ₹50,000",
            description="Digital gift voucher redeemable across all Acme retail stores. Strictly prohibited for autonomous AI checkout.",
            price=50000.0,
            currency="INR",
            stock=50,
            category="Gift Cards",
            attributes={
                "type": "gift_voucher",
                "non_refundable": True,
                "requires_manual_approval": True,
                "rating": 5.0
            },
            agent_purchasable=False, # BLOCKED BY DEFAULT
            requires_human_confirmation=True,
            max_quantity_per_agent_order=1
        ),
        Product(
            id="prod_acme_cash_card",
            name="Acme Universal Prepaid Cash Card ₹25,000",
            description="Reloadable merchant cash card. Restricted from autonomous procurement bots.",
            price=25000.0,
            currency="INR",
            stock=30,
            category="Gift Cards",
            attributes={
                "type": "cash_card",
                "non_refundable": True,
                "requires_manual_approval": True,
                "rating": 5.0
            },
            agent_purchasable=False,
            requires_human_confirmation=True,
            max_quantity_per_agent_order=1
        )
    ]

    for p in seed_products:
        existing_p = db.query(Product).filter(Product.id == p.id).first()
        if not existing_p:
            db.add(p)
        else:
            # Update attributes and price to latest seed specs
            existing_p.name = p.name
            existing_p.description = p.description
            existing_p.price = p.price
            existing_p.category = p.category
            existing_p.attributes = p.attributes
            existing_p.agent_purchasable = p.agent_purchasable
            existing_p.stock = p.stock

    db.commit()
    print(f"Database successfully seeded with {len(seed_products)} products across 5 categories.")
