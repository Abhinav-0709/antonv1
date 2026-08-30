"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, DecisionLedgerEntry } from "@/lib/api";
import TransactionFlowStepper from "@/components/TransactionFlowStepper";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  CreditCard, 
  ExternalLink
} from "lucide-react";

export default function TransactionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [entry, setEntry] = useState<DecisionLedgerEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getDecisionDetail(id)
        .then((data) => setEntry(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen py-16 text-center text-[#64748B] dark:text-[#888888] font-mono text-xs">
        Loading decision ledger entry {id}...
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen py-16 text-center space-y-3 font-mono">
        <h1 className="text-base font-bold text-[#111827] dark:text-white">Record Not Found</h1>
        <p className="text-[#64748B] dark:text-[#888888] text-xs">Could not find decision ledger entry with ID {id}.</p>
        <Link href="/merchant/transactions" className="inline-block text-[#0070F3] text-xs hover:underline font-semibold">
          ← Back to Ledger
        </Link>
      </div>
    );
  }

  const isApproved = entry.decision === "APPROVED";
  const isDeclined = entry.decision === "DECLINED";

  return (
    <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen text-[#111827] dark:text-[#EDEDED] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E4E8] dark:border-[#1F1F1F] pb-5">
          <div>
            <Link
              href="/merchant/transactions"
              className="inline-flex items-center gap-1 text-xs text-[#64748B] dark:text-[#888888] hover:text-[#111827] dark:hover:text-white transition-colors mb-2 font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Decision Ledger</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight font-mono">
                Decision #{entry.id}
              </h1>
              {isApproved ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#00C48C]/10 text-[#059669] dark:text-[#00C48C] font-bold text-xs font-mono border border-[#A7F3D0] dark:border-[#00C48C]/20">
                  APPROVED
                </span>
              ) : isDeclined ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FEF2F2] dark:bg-[#EE0000]/10 text-[#DC2626] dark:text-[#EE0000] font-bold text-xs font-mono border border-[#FCA5A5] dark:border-[#EE0000]/20">
                  DECLINED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] dark:bg-[#F5A623]/10 text-[#D97706] dark:text-[#F5A623] font-bold text-xs font-mono border border-[#FDE68A] dark:border-[#F5A623]/20">
                  HUMAN APPROVAL
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#888888] mt-1 font-mono">
              Mandate ID: {entry.mandate_id} • {new Date(entry.created_at).toLocaleString()}
            </p>
          </div>

          {isApproved && (
            <Link
              href={`/buyer/passport/${entry.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0070F3] hover:bg-[#3291FF] text-white text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
            >
              <FileText className="w-4 h-4" />
              <span>View Purchase Passport</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          )}
        </div>

        {/* Visual Stepper */}
        <div className="space-y-2">
          <h2 className="text-[11px] font-mono text-[#64748B] dark:text-[#888888] uppercase tracking-wider font-semibold">
            Transaction Lifecycle Flow
          </h2>
          <TransactionFlowStepper entry={entry} />
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Rules Breakdown (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E2E4E8] dark:border-[#1A1A1A] pb-3">
                <h3 className="text-xs font-bold text-[#111827] dark:text-white uppercase font-mono tracking-wider">
                  Mandate Policy Rule Results
                </h3>
                <span className="text-[11px] text-[#64748B] dark:text-[#888888] font-mono">
                  {entry.rules_evaluated.length} Rules Evaluated
                </span>
              </div>

              <div className="space-y-2">
                {entry.rules_evaluated.map((rule, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                      rule.passed
                        ? "bg-[#F8F9FA] dark:bg-black border-[#E2E4E8] dark:border-[#1F1F1F] text-[#111827] dark:text-[#EDEDED]"
                        : "bg-[#FEF2F2] dark:bg-[#1A0505] border-[#FCA5A5] dark:border-[#EE0000]/30 text-[#DC2626] dark:text-[#EE0000]"
                    }`}
                  >
                    <div className="mt-0.5">
                      {rule.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-[#00C48C]" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-[#DC2626] dark:text-[#EE0000]" />
                      )}
                    </div>
                    <div className="flex-1 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#111827] dark:text-white">{rule.label || rule.rule}</span>
                        <span className={`text-[10px] font-bold ${rule.passed ? "text-[#059669] dark:text-[#00C48C]" : "text-[#DC2626] dark:text-[#EE0000]"}`}>
                          {rule.passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                      <p className="text-[#64748B] dark:text-[#888888] font-sans mt-0.5 text-[11px]">{rule.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evaluated Candidates */}
            {entry.top_candidates && entry.top_candidates.length > 0 && (
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E2E4E8] dark:border-[#1A1A1A] pb-2.5 text-xs font-mono">
                  <span className="font-bold text-[#111827] dark:text-white uppercase tracking-wider">Candidate Comparison</span>
                  <span className="text-[#64748B] dark:text-[#888888]">{entry.products_evaluated_count || 12} Products</span>
                </div>

                <div className="space-y-2">
                  {entry.top_candidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        cand.product_id === entry.product_id
                          ? "bg-[#F0F7FF] dark:bg-black border-[#0070F3] text-[#111827] dark:text-white"
                          : "bg-[#F8F9FA] dark:bg-black border-[#E2E4E8] dark:border-[#1A1A1A] text-[#64748B] dark:text-[#888888]"
                      }`}
                    >
                      <div>
                        <span className="font-bold text-[#111827] dark:text-white font-sans block">{cand.product_name}</span>
                        <span className="text-[#64748B] dark:text-[#666666] font-mono text-[11px]">₹{cand.price?.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-[#0070F3] block">{cand.match_score}%</span>
                        <span className="text-[10px] text-[#64748B] dark:text-[#666666]">Match</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Financial & Razorpay Summary */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-[#111827] dark:text-white uppercase font-mono tracking-wider border-b border-[#E2E4E8] dark:border-[#1A1A1A] pb-2">
                Purchase Summary
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[#E2E4E8] dark:border-[#1A1A1A]">
                  <span className="text-[#64748B] dark:text-[#888888]">Agent</span>
                  <span className="text-[#0070F3] font-bold">{entry.agent_id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E4E8] dark:border-[#1A1A1A]">
                  <span className="text-[#64748B] dark:text-[#888888]">Product</span>
                  <span className="text-[#111827] dark:text-white truncate max-w-[150px] font-sans">{entry.product_name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E4E8] dark:border-[#1A1A1A]">
                  <span className="text-[#64748B] dark:text-[#888888]">Quantity</span>
                  <span className="text-[#111827] dark:text-white font-bold">{entry.quantity} units</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm">
                  <span className="text-[#64748B] dark:text-[#888888]">Total</span>
                  <span className="text-[#111827] dark:text-white font-bold">
                    ₹{entry.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-[#111827] dark:text-white uppercase font-mono tracking-wider border-b border-[#E2E4E8] dark:border-[#1A1A1A] pb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#059669] dark:text-[#00C48C]" />
                Razorpay Settlement
              </h3>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[#E2E4E8] dark:border-[#1A1A1A]">
                  <span className="text-[#64748B] dark:text-[#888888]">Invocation</span>
                  <span className={`font-bold ${entry.razorpay_called ? "text-[#059669] dark:text-[#00C48C]" : "text-[#64748B] dark:text-[#666666]"}`}>
                    {entry.razorpay_called ? "CALLED (POST-AUTH)" : "SKIPPED"}
                  </span>
                </div>
                {entry.razorpay_order_id && (
                  <div className="flex justify-between py-1 border-b border-[#E2E4E8] dark:border-[#1A1A1A]">
                    <span className="text-[#64748B] dark:text-[#888888]">Order ID</span>
                    <span className="text-[#111827] dark:text-white truncate max-w-[140px]">{entry.razorpay_order_id}</span>
                  </div>
                )}
                {entry.razorpay_payment_id && (
                  <div className="flex justify-between py-1 border-b border-[#E2E4E8] dark:border-[#1A1A1A]">
                    <span className="text-[#64748B] dark:text-[#888888]">Payment ID</span>
                    <span className="text-[#111827] dark:text-white truncate max-w-[140px]">{entry.razorpay_payment_id}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B] dark:text-[#888888]">Payment Status</span>
                  <span className="font-bold text-[#059669] dark:text-[#00C48C]">{entry.payment_status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
