import Link from "next/link";
import { 
  Bot, 
  Store, 
  ArrowRight, 
  Sliders, 
  FileText, 
  Lock, 
  Cpu
} from "lucide-react";

export default function Home() {
  return (
    <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] text-xs font-mono text-[#64748B] dark:text-[#888888] shadow-sm">
            <span className="text-[#0070F3] font-semibold">Track 01</span>
            <span>•</span>
            <span>AI Growth & Agentic Commerce</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#111827] dark:text-white leading-tight">
            Safe Commerce for <br />
            <span className="text-[#0070F3]">Autonomous AI Buyers</span>
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] dark:text-[#888888] max-w-xl mx-auto leading-relaxed font-normal">
            Anton is the merchant-side authorization and trust layer between external AI buyers and Razorpay payments.
          </p>

          {/* Gateway Law Banner */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] text-xs font-mono text-[#64748B] dark:text-[#888888] max-w-lg mx-auto shadow-sm">
            <p className="text-[#111827] dark:text-[#EDEDED]">
              <span className="text-[#0070F3] font-semibold">AI proposes.</span>{" "}
              <span className="text-[#059669] dark:text-[#00C48C] font-semibold">Policy decides.</span>{" "}
              <span className="text-[#0070F3] font-semibold">Razorpay executes.</span>{" "}
              <span className="text-[#D97706] dark:text-[#F5A623] font-semibold">Ledger remembers.</span>
            </p>
          </div>

          {/* Entry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-left">
            {/* Card 1: AI Buyer */}
            <Link
              href="/buyer"
              className="group p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] hover:border-[#0070F3] dark:hover:border-[#0070F3] transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F0F2F5] dark:bg-black border border-[#E2E4E8] dark:border-[#222222] flex items-center justify-center text-[#0070F3] group-hover:border-[#0070F3] transition-colors">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-[#0070F3] uppercase tracking-wider font-semibold">Experience 01</span>
                  <h2 className="text-lg font-bold text-[#111827] dark:text-white mt-1 group-hover:text-[#0070F3] transition-colors">
                    AI Buyer & Purchase Passport
                  </h2>
                  <p className="text-xs text-[#64748B] dark:text-[#888888] mt-1.5 leading-relaxed font-sans">
                    Query products in natural language, evaluate candidates, submit bounded mandates, and inspect grounded Purchase Passports.
                  </p>
                </div>
              </div>
              <div className="pt-5 flex items-center text-xs font-semibold text-[#0070F3] group-hover:translate-x-1 transition-transform">
                <span>Open AI Buyer Simulator</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </div>
            </Link>

            {/* Card 2: Merchant Control */}
            <Link
              href="/merchant"
              className="group p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] hover:border-[#0070F3] dark:hover:border-[#0070F3] transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F0F2F5] dark:bg-black border border-[#E2E4E8] dark:border-[#222222] flex items-center justify-center text-[#0070F3] group-hover:border-[#0070F3] transition-colors">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-[#0070F3] uppercase tracking-wider font-semibold">Experience 02</span>
                  <h2 className="text-lg font-bold text-[#111827] dark:text-white mt-1 group-hover:text-[#0070F3] transition-colors">
                    Merchant Control Plane
                  </h2>
                  <p className="text-xs text-[#64748B] dark:text-[#888888] mt-1.5 leading-relaxed font-sans">
                    Inspect the live Decision Ledger, configure deterministic spending policies, revoke rogue agents, and simulate mandates.
                  </p>
                </div>
              </div>
              <div className="pt-5 flex items-center text-xs font-semibold text-[#0070F3] group-hover:translate-x-1 transition-transform">
                <span>Open Merchant Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </div>
            </Link>
          </div>
        </div>

        {/* 5-Step Architecture Flow */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E4E8] dark:border-[#1F1F1F] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#111827] dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0070F3]" />
                The Deterministic Policy Flow
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#888888] mt-0.5 font-sans">
                LLM interprets intent. Server-side rules authorize money. Razorpay executes only if approved.
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-[#059669] dark:text-[#00C48C] bg-[#ECFDF5] dark:bg-[#00C48C]/10 border border-[#A7F3D0] dark:border-[#00C48C]/20 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
              Deterministic Authorization
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1.5">
              <span className="text-[#0070F3] font-bold block">01. Intent</span>
              <p className="text-[#64748B] dark:text-[#888888] font-sans text-[11px]">
                AI parses natural language into bounded parameters.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1.5">
              <span className="text-[#0070F3] font-bold block">02. Mandate</span>
              <p className="text-[#64748B] dark:text-[#888888] font-sans text-[11px]">
                Structured purchase request with immutable quantities & price caps.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#0070F3]/40 space-y-1.5 relative">
              <span className="text-[#0070F3] font-bold block">03. Policy Engine</span>
              <p className="text-[#64748B] dark:text-[#888888] font-sans text-[11px]">
                Deterministic checks: velocity, revocation, category, stock.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1.5">
              <span className="text-[#059669] dark:text-[#00C48C] font-bold block">04. Razorpay</span>
              <p className="text-[#64748B] dark:text-[#888888] font-sans text-[11px]">
                Order created ONLY IF authorized. Never called if declined.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1.5">
              <span className="text-[#D97706] dark:text-[#F5A623] font-bold block">05. Audit Ledger</span>
              <p className="text-[#64748B] dark:text-[#888888] font-sans text-[11px]">
                Immutable record & grounded Purchase Passport for the buyer.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-2 shadow-sm">
            <h4 className="font-bold text-[#111827] dark:text-white text-sm text-[#0070F3]">Zero LLM Overrides on Money</h4>
            <p className="text-[#64748B] dark:text-[#888888] leading-relaxed font-sans">
              The AI never makes the authorization decision. All limits, budgets, and velocity controls run 100% server-side.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-2 shadow-sm">
            <h4 className="font-bold text-[#111827] dark:text-white text-sm text-[#0070F3]">Instant Agent Revocation</h4>
            <p className="text-[#64748B] dark:text-[#888888] leading-relaxed font-sans">
              Merchants can revoke rogue or unverified agents in real time. Subsequent purchase mandates are immediately blocked.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-2 shadow-sm">
            <h4 className="font-bold text-[#111827] dark:text-white text-sm text-[#0070F3]">Grounded Purchase Passport</h4>
            <p className="text-[#64748B] dark:text-[#888888] leading-relaxed font-sans">
              Transparent post-purchase report detailing all candidates considered, price trade-offs, and Razorpay confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
