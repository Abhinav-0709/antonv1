"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, DecisionLedgerEntry } from "@/lib/api";
import { TableSkeletonRows } from "@/components/Skeletons";
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  RefreshCw
} from "lucide-react";

export default function TransactionsLedgerPage() {
  const [entries, setEntries] = useState<DecisionLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadLedger = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (filterDecision !== "ALL") {
        params.decision = filterDecision;
      }
      const data = await api.getLedger(params);
      setEntries(data);
    } catch (err) {
      console.error("Failed to load decision ledger", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [filterDecision]);

  const filteredEntries = entries.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.id.toLowerCase().includes(q) ||
      e.agent_id.toLowerCase().includes(q) ||
      e.product_name.toLowerCase().includes(q) ||
      (e.buyer_prompt && e.buyer_prompt.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen text-[#111827] dark:text-[#EDEDED] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E4E8] dark:border-[#1F1F1F] pb-5">
          <div>
            <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0070F3]" />
              Decision Ledger
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#888888] mt-0.5 font-sans">
              Immutable audit record of autonomous purchase mandates, rule results, and payments.
            </p>
          </div>

          <button
            onClick={loadLedger}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0A0A0A] hover:bg-[#F3F4F6] dark:hover:bg-[#111111] text-[#64748B] dark:text-[#888888] hover:text-[#111827] dark:hover:text-white text-xs font-semibold border border-[#E2E4E8] dark:border-[#1F1F1F] transition-colors shadow-sm self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-white dark:bg-[#0A0A0A] p-3.5 rounded-2xl border border-[#E2E4E8] dark:border-[#1F1F1F] shadow-sm">
          {/* Decision Filters */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto text-xs">
            {["ALL", "APPROVED", "DECLINED", "HUMAN_APPROVAL_REQUIRED"].map((d) => (
              <button
                key={d}
                onClick={() => setFilterDecision(d)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap text-xs ${
                  filterDecision === d
                    ? "bg-[#0070F3] text-white shadow-sm"
                    : "bg-[#F8F9FA] dark:bg-black text-[#64748B] dark:text-[#888888] hover:text-[#111827] dark:hover:text-white border border-[#E2E4E8] dark:border-[#1F1F1F]"
                }`}
              >
                {d === "ALL"
                  ? "All Records"
                  : d === "APPROVED"
                  ? "Approved"
                  : d === "DECLINED"
                  ? "Declined"
                  : "Human Approval"}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#666666] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#111827] dark:text-white placeholder-[#94A3B8] dark:placeholder-[#666666] focus:outline-none focus:border-[#0070F3] dark:focus:border-[#0070F3]"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-[#E2E4E8] dark:border-[#1F1F1F] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] dark:bg-black text-[#64748B] dark:text-[#888888] uppercase text-[10px] border-b border-[#E2E4E8] dark:border-[#1F1F1F] font-mono">
                <tr>
                  <th className="py-3 px-3.5">Decision ID</th>
                  <th className="py-3 px-3.5">Agent</th>
                  <th className="py-3 px-3.5">Product & Qty</th>
                  <th className="py-3 px-3.5">Total Amount</th>
                  <th className="py-3 px-3.5">Verdict</th>
                  <th className="py-3 px-3.5">Reason</th>
                  <th className="py-3 px-3.5">Razorpay</th>
                  <th className="py-3 px-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E4E8] dark:divide-[#1A1A1A] font-mono">
                {loading && entries.length === 0 ? (
                  <TableSkeletonRows count={8} cols={8} />
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-[#64748B] dark:text-[#666666] text-xs font-sans">
                      No ledger entries matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const isApproved = entry.decision === "APPROVED";
                    const isDeclined = entry.decision === "DECLINED";

                    return (
                      <tr key={entry.id} className="hover:bg-[#F8F9FA] dark:hover:bg-[#111111] transition-colors">
                        <td className="py-3.5 px-3.5 font-bold text-[#111827] dark:text-white">
                          {entry.id}
                        </td>
                        <td className="py-3.5 px-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#F0F2F5] dark:bg-black border border-[#E2E4E8] dark:border-[#222222] text-[#0070F3] text-[11px] font-semibold">
                            {entry.agent_id}
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 text-[#111827] dark:text-white font-sans max-w-[180px]">
                          <div className="font-semibold truncate">{entry.product_name}</div>
                          <span className="text-[10px] text-[#64748B] dark:text-[#666666] font-mono">Qty: {entry.quantity}</span>
                        </td>
                        <td className="py-3.5 px-3.5 font-bold text-[#111827] dark:text-white">
                          ₹{entry.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-3.5">
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
                              HUMAN
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 font-sans text-[#64748B] dark:text-[#888888] text-[11px] max-w-[240px] truncate" title={entry.decision_reason}>
                          {entry.decision_reason}
                        </td>
                        <td className="py-3.5 px-3.5">
                          {entry.razorpay_called ? (
                            <span className="text-[#059669] dark:text-[#00C48C] text-[11px] font-semibold block">{entry.payment_status}</span>
                          ) : (
                            <span className="text-[#64748B] dark:text-[#666666] text-[10px]">
                              NOT INVOKED
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 text-right font-sans">
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
