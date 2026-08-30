"use client";

import { useEffect, useState, useRef } from "react";
import { api, MerchantPolicy, Product, Agent } from "@/lib/api";
import { SimulationSkeleton } from "@/components/Skeletons";
import { 
  Sliders, 
  Save, 
  Play
} from "lucide-react";

export default function PolicyStudioPage() {
  const [policy, setPolicy] = useState<MerchantPolicy | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulation form state
  const [simAgentId, setSimAgentId] = useState("agent_42");
  const [simProductId, setSimProductId] = useState("");
  const [simQuantity, setSimQuantity] = useState(1);
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  // Auto-scroll ref
  const simResultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api.getPolicy(), api.getCatalog(), api.getAgents()]).then(([pData, prodData, agentData]) => {
      setPolicy(pData);
      setProducts(prodData);
      setAgents(agentData);
      if (prodData.length > 0) {
        setSimProductId(prodData[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (simResult && simResultRef.current) {
      setTimeout(() => {
        simResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [simResult]);

  const handleSavePolicy = async () => {
    if (!policy) return;
    try {
      setSaving(true);
      const updated = await api.updatePolicy({
        merchant_name: policy.merchant_name,
        max_autonomous_transaction_limit: Number(policy.max_autonomous_transaction_limit),
        daily_spend_limit_per_agent: Number(policy.daily_spend_limit_per_agent),
        human_approval_threshold: Number(policy.human_approval_threshold),
        max_quantity_per_order: Number(policy.max_quantity_per_order),
        allowed_categories: policy.allowed_categories,
        blocked_categories: policy.blocked_categories,
      });
      setPolicy(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to update policy", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRunSimulation = async () => {
    if (!simProductId) return;
    try {
      setSimulating(true);
      setSimResult(null);
      const result = await api.simulatePolicy({
        agent_id: simAgentId,
        product_id: simProductId,
        quantity: simQuantity,
      });
      setSimResult(result);
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setSimulating(false);
    }
  };

  if (!policy) {
    return <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen p-8 text-[#64748B] dark:text-[#888888] font-mono text-xs">Loading Policy Studio...</div>;
  }

  return (
    <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen text-[#111827] dark:text-[#EDEDED] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E4E8] dark:border-[#1F1F1F] pb-5">
          <div>
            <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#0070F3]" />
              Policy Studio & Simulation
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#888888] mt-0.5 font-sans">
              Configure deterministic commerce boundaries and simulate rule evaluation in real time.
            </p>
          </div>

          <button
            onClick={handleSavePolicy}
            disabled={saving}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0070F3] hover:bg-[#3291FF] text-white text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Policy"}</span>
          </button>
        </div>

        {/* Two Column Layout: Editor & Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Policy Configuration */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-4 shadow-sm">
            <div className="border-b border-[#E2E4E8] dark:border-[#1A1A1A] pb-3">
              <h2 className="text-xs font-mono font-bold text-[#111827] dark:text-white uppercase tracking-wider">
                Spending Boundaries
              </h2>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#64748B] dark:text-[#888888] mb-1 font-medium">Merchant Store Name</label>
                <input
                  type="text"
                  value={policy.merchant_name}
                  onChange={(e) => setPolicy({ ...policy, merchant_name: e.target.value })}
                  className="w-full bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-xl px-3 py-2 text-[#111827] dark:text-white focus:outline-none focus:border-[#0070F3] dark:focus:border-[#0070F3]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] dark:text-[#888888] mb-1 font-mono font-medium">Max Autonomous Transaction Limit (₹)</label>
                <input
                  type="number"
                  value={policy.max_autonomous_transaction_limit}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      max_autonomous_transaction_limit: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-xl px-3 py-2 text-[#111827] dark:text-white font-mono focus:outline-none focus:border-[#0070F3] dark:focus:border-[#0070F3]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] dark:text-[#888888] mb-1 font-mono font-medium">Daily Limit Per Agent (₹)</label>
                <input
                  type="number"
                  value={policy.daily_spend_limit_per_agent}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      daily_spend_limit_per_agent: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-xl px-3 py-2 text-[#111827] dark:text-white font-mono focus:outline-none focus:border-[#0070F3] dark:focus:border-[#0070F3]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] dark:text-[#888888] mb-1 font-mono font-medium">Max Units Per Order</label>
                <input
                  type="number"
                  value={policy.max_quantity_per_order}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      max_quantity_per_order: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-xl px-3 py-2 text-[#111827] dark:text-white font-mono focus:outline-none focus:border-[#0070F3] dark:focus:border-[#0070F3]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] dark:text-[#888888] mb-1 font-medium">Allowed Categories (comma separated)</label>
                <input
                  type="text"
                  value={policy.allowed_categories.join(", ")}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      allowed_categories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-xl px-3 py-2 text-[#111827] dark:text-white focus:outline-none focus:border-[#0070F3] dark:focus:border-[#0070F3]"
                />
              </div>

              <div>
                <label className="block text-[#64748B] dark:text-[#888888] mb-1 font-medium">Blocked Categories (comma separated)</label>
                <input
                  type="text"
                  value={policy.blocked_categories.join(", ")}
                  onChange={(e) =>
                    setPolicy({
                      ...policy,
                      blocked_categories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-xl px-3 py-2 text-[#DC2626] dark:text-[#EE0000] focus:outline-none focus:border-[#DC2626] dark:focus:border-[#EE0000]"
                />
              </div>
            </div>
          </div>

          {/* Right: Policy Simulation Sandbox */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="border-b border-[#E2E4E8] dark:border-[#1A1A1A] pb-3">
                <h2 className="text-xs font-mono font-bold text-[#111827] dark:text-white uppercase tracking-wider">
                  Simulation Sandbox
                </h2>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#64748B] dark:text-[#888888] mb-1 font-mono font-medium">Agent Identity</label>
                  <select
                    value={simAgentId}
                    onChange={(e) => setSimAgentId(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-xl px-3 py-2 text-[#111827] dark:text-white focus:outline-none focus:border-[#0070F3] dark:focus:border-[#0070F3] font-mono"
                  >
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id} className="bg-white dark:bg-[#0A0A0A] text-[#111827] dark:text-white">
                        {ag.name} ({ag.id}) [{ag.status}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748B] dark:text-[#888888] mb-1 font-mono font-medium">Catalog Item</label>
                  <select
                    value={simProductId}
                    onChange={(e) => setSimProductId(e.target.value)}
                    className="w-full bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-xl px-3 py-2 text-[#111827] dark:text-white focus:outline-none focus:border-[#0070F3] dark:focus:border-[#0070F3]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-white dark:bg-[#0A0A0A] text-[#111827] dark:text-white">
                        {p.name} — ₹{p.price.toLocaleString("en-IN")} [{p.category}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#64748B] dark:text-[#888888] mb-1 font-mono font-medium">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={simQuantity}
                    onChange={(e) => setSimQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-xl px-3 py-2 text-[#111827] dark:text-white font-mono focus:outline-none focus:border-[#0070F3] dark:focus:border-[#0070F3]"
                  />
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={simulating}
                  className="w-full py-2.5 rounded-xl bg-[#0070F3] hover:bg-[#3291FF] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{simulating ? "Evaluating..." : "Run Policy Check"}</span>
                </button>
              </div>

              {simulating && <SimulationSkeleton />}

              {simResult && (
                <div ref={simResultRef} className="pt-3 border-t border-[#E2E4E8] dark:border-[#1A1A1A] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#64748B] dark:text-[#888888]">Verdict:</span>
                    {simResult.overall_decision === "APPROVED" ? (
                      <span className="text-[#059669] dark:text-[#00C48C] font-bold">✓ APPROVED</span>
                    ) : (
                      <span className="text-[#DC2626] dark:text-[#EE0000] font-bold">✗ DECLINED</span>
                    )}
                  </div>

                  <p className="text-xs text-[#111827] dark:text-[#EDEDED] bg-[#F8F9FA] dark:bg-black p-3 rounded-xl border border-[#E2E4E8] dark:border-[#1F1F1F]">
                    {simResult.summary}
                  </p>

                  <div className="space-y-1">
                    {simResult.rules.map((r: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1A1A1A]"
                      >
                        <span className="text-[#64748B] dark:text-[#888888]">{r.rule_name}</span>
                        <span className={`font-mono font-bold ${r.passed ? "text-[#059669] dark:text-[#00C48C]" : "text-[#DC2626] dark:text-[#EE0000]"}`}>
                          {r.passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
