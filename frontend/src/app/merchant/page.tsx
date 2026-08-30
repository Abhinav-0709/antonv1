"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  api, 
  LedgerSummaryStats, 
  DecisionLedgerEntry, 
  MerchantPolicy 
} from "@/lib/api";
import { StatsCardSkeleton, TableSkeletonRows } from "@/components/Skeletons";
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

export default function MerchantOverview() {
  const [stats, setStats] = useState<LedgerSummaryStats | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<DecisionLedgerEntry[]>([]);
  const [policy, setPolicy] = useState<MerchantPolicy | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, ledgerData, policyData] = await Promise.all([
        api.getLedgerStats(),
        api.getLedger({ limit: 6 }),
        api.getPolicy(),
      ]);
      setStats(statsData);
      setRecentDecisions(ledgerData);
      setPolicy(policyData);
    } catch (err) {
      console.error("Failed to load merchant data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen text-[#111827] dark:text-[#EDEDED] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E4E8] dark:border-[#1F1F1F] pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight">Merchant Control Plane</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-[#0A0A0A] text-[#0070F3] border border-[#E2E4E8] dark:border-[#1F1F1F] font-mono font-semibold shadow-sm">
                {policy?.merchant_name || "Acme Store"}
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#888888] mt-0.5 font-sans">
              Monitor autonomous AI purchase mandates, spending velocity, and Razorpay settlements.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={loadData}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0A0A0A] hover:bg-[#F3F4F6] dark:hover:bg-[#111111] text-[#64748B] dark:text-[#888888] hover:text-[#111827] dark:hover:text-white text-xs font-semibold border border-[#E2E4E8] dark:border-[#1F1F1F] transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/buyer"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0070F3] hover:bg-[#3291FF] text-white text-xs font-semibold shadow-sm hover:shadow-md transition-colors"
            >
              <span>AI Buyer Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* KPI Stats Grid */}
        {loading && !stats ? (
          <StatsCardSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1 shadow-sm">
              <span className="text-[#64748B] dark:text-[#888888] text-xs font-semibold block">Settled Volume (Razorpay)</span>
              <div className="text-2xl font-bold text-[#111827] dark:text-white font-mono">
                ₹{stats ? stats.total_transacted_volume.toLocaleString("en-IN") : "0"}
              </div>
              <p className="text-[11px] text-[#059669] dark:text-[#00C48C] font-semibold mt-0.5">✓ 100% Policy Authorized</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1 shadow-sm">
              <span className="text-[#64748B] dark:text-[#888888] text-xs font-semibold block">Approved Mandates</span>
              <div className="text-2xl font-bold text-[#0070F3] font-mono">
                {stats ? stats.approved_count : 0}
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#888888] mt-0.5">Passed all policy limits</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1 shadow-sm">
              <span className="text-[#64748B] dark:text-[#888888] text-xs font-semibold block">Declined / Blocked</span>
              <div className="text-2xl font-bold text-[#DC2626] dark:text-[#EE0000] font-mono">
                {stats ? stats.declined_count : 0}
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-[#888888] mt-0.5">Razorpay safely bypassed</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1 shadow-sm">
              <span className="text-[#64748B] dark:text-[#888888] text-xs font-semibold block">Connected Agents</span>
              <div className="text-2xl font-bold text-[#111827] dark:text-white font-mono">
                {stats ? stats.active_agents_count : 0}
              </div>
              <p className="text-[11px] text-[#0070F3] font-semibold mt-0.5">Active contracts</p>
            </div>
          </div>
        )}

        {/* Active Boundaries Bar */}
        {policy && (
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#E2E4E8] dark:border-[#1F1F1F] pb-3">
              <h2 className="text-xs font-mono font-bold text-[#111827] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#0070F3]" />
                Active Autonomous Spending Boundaries
              </h2>
              <Link
                href="/merchant/policies"
                className="text-xs text-[#0070F3] hover:underline font-mono font-semibold"
              >
                Edit Policies →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F]">
                <span className="text-[#64748B] dark:text-[#888888] block text-[10px] uppercase font-semibold">Max Transaction Cap</span>
                <span className="text-[#111827] dark:text-white font-bold mt-0.5 block text-sm">
                  ₹{policy.max_autonomous_transaction_limit.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F]">
                <span className="text-[#64748B] dark:text-[#888888] block text-[10px] uppercase font-semibold">Daily Cap / Agent</span>
                <span className="text-[#111827] dark:text-white font-bold mt-0.5 block text-sm">
                  ₹{policy.daily_spend_limit_per_agent.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F]">
                <span className="text-[#64748B] dark:text-[#888888] block text-[10px] uppercase font-semibold">Max Order Quantity</span>
                <span className="text-[#111827] dark:text-white font-bold mt-0.5 block text-sm">
                  {policy.max_quantity_per_order} units
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F]">
                <span className="text-[#64748B] dark:text-[#888888] block text-[10px] uppercase font-semibold">Allowed Categories</span>
                <span className="text-[#059669] dark:text-[#00C48C] font-bold mt-0.5 block truncate font-sans text-xs">
                  {policy.allowed_categories.join(", ")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Decision Ledger Feed Table */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E4E8] dark:border-[#1F1F1F] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white">Recent Decisions</h2>
              <p className="text-xs text-[#64748B] dark:text-[#888888] mt-0.5 font-sans">
                Live audit stream of AI buyer mandates and policy verdicts.
              </p>
            </div>
            <Link
              href="/merchant/transactions"
              className="text-xs text-[#0070F3] hover:underline font-mono font-semibold"
            >
              View Full Ledger →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] dark:bg-black text-[#64748B] dark:text-[#888888] uppercase text-[10px] border-b border-[#E2E4E8] dark:border-[#1F1F1F] font-mono">
                <tr>
                  <th className="py-2.5 px-3">Decision ID</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Policy Verdict</th>
                  <th className="py-2.5 px-3">Razorpay</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4E8] dark:divide-[#1A1A1A] font-mono">
                {loading && recentDecisions.length === 0 ? (
                  <TableSkeletonRows count={5} cols={7} />
                ) : recentDecisions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#64748B] dark:text-[#666666] text-xs font-sans">
                      No transactions recorded yet. Submit a request from the AI Buyer interface.
                    </td>
                  </tr>
                ) : (
                  recentDecisions.map((entry) => {
                    const isApproved = entry.decision === "APPROVED";
                    const isDeclined = entry.decision === "DECLINED";

                    return (
                      <tr key={entry.id} className="hover:bg-[#F8F9FA] dark:hover:bg-[#111111] transition-colors">
                        <td className="py-3 px-3 font-bold text-[#111827] dark:text-[#EDEDED]">
                          {entry.id}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-[#F0F2F5] dark:bg-black border border-[#E2E4E8] dark:border-[#222222] text-[#0070F3] text-[11px] font-semibold">
                            {entry.agent_id}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#111827] dark:text-white font-sans truncate max-w-[180px]">
                          {entry.product_name} <span className="text-[#64748B] dark:text-[#666666]">×{entry.quantity}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#111827] dark:text-white">
                          ₹{entry.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 text-[#059669] dark:text-[#00C48C] font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              APPROVED
                            </span>
                          ) : isDeclined ? (
                            <span className="inline-flex items-center gap-1 text-[#DC2626] dark:text-[#EE0000] font-bold text-[11px]">
                              <XCircle className="w-3.5 h-3.5" />
                              DECLINED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#D97706] dark:text-[#F5A623] font-bold text-[11px]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              MANUAL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {entry.razorpay_called ? (
                            <span className="text-[#059669] dark:text-[#00C48C] text-[11px] font-semibold">
                              {entry.payment_status}
                            </span>
                          ) : (
                            <span className="text-[#64748B] dark:text-[#666666] text-[10px]">
                              SKIPPED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <Link
                            href={`/merchant/transactions/${entry.id}`}
                            className="text-[#0070F3] hover:underline text-xs font-semibold"
                          >
                            Inspect →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
