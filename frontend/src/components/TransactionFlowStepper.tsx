"use client";

import { DecisionLedgerEntry } from "@/lib/api";

interface TransactionFlowStepperProps {
  entry: DecisionLedgerEntry;
}

export default function TransactionFlowStepper({ entry }: TransactionFlowStepperProps) {
  const isApproved = entry.decision === "APPROVED";
  const isDeclined = entry.decision === "DECLINED";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs font-mono">
      {/* 1. Intent */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1 shadow-sm">
        <span className="text-[#0070F3] font-bold block">01. Intent</span>
        <p className="text-[#64748B] dark:text-[#888888] font-sans text-[11px] truncate" title={entry.buyer_prompt || ""}>
          "{entry.buyer_prompt || "Intent"}"
        </p>
      </div>

      {/* 2. Discovery */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1 shadow-sm">
        <span className="text-[#0070F3] font-bold block">02. Pick</span>
        <p className="text-[#111827] dark:text-white font-sans text-[11px] truncate">
          {entry.product_name}
        </p>
      </div>

      {/* 3. Mandate */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1 shadow-sm">
        <span className="text-[#0070F3] font-bold block">03. Mandate</span>
        <p className="text-[#111827] dark:text-white font-mono font-bold text-[11px]">
          ₹{entry.amount.toLocaleString("en-IN")} ({entry.quantity}u)
        </p>
      </div>

      {/* 4. Policy Engine */}
      <div className={`p-3.5 rounded-xl border space-y-1 shadow-sm ${
        isApproved 
          ? "bg-[#ECFDF5] dark:bg-[#0A0A0A] border-[#A7F3D0] dark:border-[#00C48C]/40 text-[#059669] dark:text-[#00C48C]" 
          : "bg-[#FEF2F2] dark:bg-[#1A0505] border-[#FCA5A5] dark:border-[#EE0000]/40 text-[#DC2626] dark:text-[#EE0000]"
      }`}>
        <span className="font-bold block">04. Policy</span>
        <p className="font-sans text-[11px] truncate font-semibold" title={entry.decision_reason}>
          {entry.decision}
        </p>
      </div>

      {/* 5. Razorpay */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1 shadow-sm">
        <span className="text-[#64748B] dark:text-[#888888] font-bold block">05. Razorpay</span>
        <p className={`font-mono text-[11px] font-semibold ${entry.razorpay_called ? "text-[#059669] dark:text-[#00C48C]" : "text-[#64748B] dark:text-[#666666]"}`}>
          {entry.razorpay_called ? entry.payment_status : "NOT INVOKED"}
        </p>
      </div>
    </div>
  );
}
