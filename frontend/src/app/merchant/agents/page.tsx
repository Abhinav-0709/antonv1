"use client";

import { useEffect, useState } from "react";
import { api, Agent } from "@/lib/api";
import { 
  Users, 
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export default function AgentAccessPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentForRevoke, setSelectedAgentForRevoke] = useState<Agent | null>(null);
  const [revokeReason, setRevokeReason] = useState("Exceeded velocity limit / Merchant manual action");
  const [actionLoading, setActionLoading] = useState(false);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await api.getAgents();
      setAgents(data);
    } catch (err) {
      console.error("Failed to load agents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleRevoke = async () => {
    if (!selectedAgentForRevoke) return;
    try {
      setActionLoading(true);
      await api.revokeAgent(selectedAgentForRevoke.id, revokeReason);
      setSelectedAgentForRevoke(null);
      await loadAgents();
    } catch (err) {
      console.error("Failed to revoke agent", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (agentId: string) => {
    try {
      setActionLoading(true);
      await api.restoreAgent(agentId);
      await loadAgents();
    } catch (err) {
      console.error("Failed to restore agent", err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen text-[#111827] dark:text-[#EDEDED] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E4E8] dark:border-[#1F1F1F] pb-5">
          <div>
            <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0070F3]" />
              Agent Access & Revocation
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#888888] mt-0.5 font-sans">
              Manage permissions and instantaneously revoke rogue or suspicious AI buyers.
            </p>
          </div>

          <button
            onClick={loadAgents}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0A0A0A] hover:bg-[#F3F4F6] dark:hover:bg-[#111111] text-[#64748B] dark:text-[#888888] hover:text-[#111827] dark:hover:text-white text-xs font-semibold border border-[#E2E4E8] dark:border-[#1F1F1F] transition-colors shadow-sm self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading && agents.length === 0 ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] animate-pulse space-y-3 shadow-sm">
                <div className="h-4 w-32 bg-[#E2E4E8] dark:bg-[#1F1F1F] rounded"></div>
                <div className="h-10 w-full bg-[#F8F9FA] dark:bg-black rounded-xl"></div>
              </div>
            ))
          ) : (
            agents.map((ag) => {
              const isActive = ag.status === "ACTIVE";
              const isRevoked = ag.status === "REVOKED";

              return (
                <div
                  key={ag.id}
                  className={`p-6 rounded-2xl bg-white dark:bg-[#0A0A0A] border space-y-4 transition-all shadow-sm ${
                    isActive ? "border-[#E2E4E8] dark:border-[#1F1F1F]" : "border-[#FCA5A5] dark:border-[#EE0000]/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#111827] dark:text-white">{ag.name}</h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F0F2F5] dark:bg-black text-[#0070F3] font-mono border border-[#E2E4E8] dark:border-[#1F1F1F] font-semibold">
                          {ag.id}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] dark:text-[#888888] mt-0.5 font-sans">{ag.description}</p>
                    </div>

                    {isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#00C48C]/10 text-[#059669] dark:text-[#00C48C] font-bold text-[11px] font-mono border border-[#A7F3D0] dark:border-transparent">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FEF2F2] dark:bg-[#EE0000]/10 text-[#DC2626] dark:text-[#EE0000] font-bold text-[11px] font-mono border border-[#FCA5A5] dark:border-transparent">
                        REVOKED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-[#F8F9FA] dark:bg-black p-3 rounded-xl border border-[#E2E4E8] dark:border-[#1F1F1F] font-mono">
                    <div>
                      <span className="text-[#64748B] dark:text-[#666666] block text-[10px] uppercase font-semibold">Limit</span>
                      <span className="font-bold text-[#111827] dark:text-white text-[11px]">
                        ₹{ag.max_transaction_limit?.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] dark:text-[#666666] block text-[10px] uppercase font-semibold">Daily Cap</span>
                      <span className="font-bold text-[#111827] dark:text-white text-[11px]">
                        ₹{ag.daily_spend_limit?.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B] dark:text-[#666666] block text-[10px] uppercase font-semibold">Spent Today</span>
                      <span className="font-bold text-[#0070F3] text-[11px]">
                        ₹{(ag.spent_today || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {isRevoked && (
                    <div className="p-3 rounded-xl bg-[#FEF2F2] dark:bg-[#EE0000]/10 border border-[#FCA5A5] dark:border-[#EE0000]/20 text-xs text-[#DC2626] dark:text-[#EE0000] space-y-0.5">
                      <span className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Access Revoked
                      </span>
                      <p className="text-[11px] text-[#111827] dark:text-[#EDEDED]">Reason: {ag.revocation_reason}</p>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B] dark:text-[#666666] font-mono">
                      Tier: <strong className="text-[#111827] dark:text-[#EDEDED]">{ag.trust_tier}</strong>
                    </span>

                    {isActive ? (
                      <button
                        onClick={() => setSelectedAgentForRevoke(ag)}
                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-black hover:bg-[#FEF2F2] dark:hover:bg-[#111111] text-[#DC2626] dark:text-[#EE0000] border border-[#FCA5A5] dark:border-[#EE0000]/30 hover:border-[#DC2626] dark:hover:border-[#EE0000] text-xs font-semibold transition-colors shadow-sm"
                      >
                        Revoke Access
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestore(ag.id)}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-black hover:bg-[#ECFDF5] dark:hover:bg-[#111111] text-[#059669] dark:text-[#00C48C] border border-[#A7F3D0] dark:border-[#00C48C]/30 hover:border-[#059669] dark:hover:border-[#00C48C] text-xs font-semibold transition-colors shadow-sm"
                      >
                        Restore Access
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Revocation Modal */}
        {selectedAgentForRevoke && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-sm font-bold text-[#111827] dark:text-white">Revoke Agent Authorization</h3>
              <p className="text-xs text-[#64748B] dark:text-[#888888]">
                Target: {selectedAgentForRevoke.name} ({selectedAgentForRevoke.id})
              </p>

              <div className="text-xs space-y-1">
                <label className="block text-[#64748B] dark:text-[#888888] font-medium">Revocation Reason</label>
                <input
                  type="text"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-xl px-3 py-2 text-[#111827] dark:text-white focus:outline-none focus:border-[#DC2626] dark:focus:border-[#EE0000]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedAgentForRevoke(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F0F2F5] dark:bg-black hover:bg-[#E5E7EB] dark:hover:bg-[#111111] text-[#64748B] dark:text-[#888888] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={actionLoading}
                  className="px-4 py-1.5 rounded-xl bg-[#DC2626] dark:bg-[#EE0000] hover:bg-[#B91C1C] dark:hover:bg-[#CC0000] text-white text-xs font-semibold shadow-sm"
                >
                  Confirm Revocation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
