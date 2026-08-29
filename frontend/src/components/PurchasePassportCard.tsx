"use client";

import { PurchasePassport } from "@/lib/api";
import { 
  ShieldCheck, 
  CheckCircle2, 
  CreditCard
} from "lucide-react";

interface PurchasePassportCardProps {
  passport: PurchasePassport;
}

export default function PurchasePassportCard({ passport }: PurchasePassportCardProps) {
  return (
    <div className="max-w-xl mx-auto rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] shadow-sm hover:shadow-md overflow-hidden font-sans text-[#111827] dark:text-[#EDEDED] transition-colors">
      {/* Header */}
      <div className="bg-[#F8F9FA] dark:bg-[#111111] p-5 border-b border-[#E2E4E8] dark:border-[#1F1F1F] flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#E0F2FE] dark:bg-[#0070F3]/10 text-[#0284C7] dark:text-[#0070F3] border border-[#BAE6FD] dark:border-[#0070F3]/30">
              Verified Purchase Passport
            </span>
            <span className="text-xs font-mono text-[#64748B] dark:text-[#666666]">
              {passport.passport_id}
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#111827] dark:text-white tracking-tight">
            Purchase Authorization Report
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#888888]">
            Merchant: <strong className="text-[#111827] dark:text-white">{passport.merchant_name}</strong>
          </p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-white dark:bg-black border border-[#E2E4E8] dark:border-[#222222] flex items-center justify-center text-[#0070F3] shadow-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-4 text-xs">
        {/* Selected Product & Price */}
        <div className="p-3.5 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#64748B] dark:text-[#666666] uppercase font-mono font-medium">Selected Product</span>
            <h3 className="text-sm font-bold text-[#111827] dark:text-white">{passport.product_name}</h3>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[#059669] dark:text-[#00C48C] font-mono">
              ₹{passport.amount.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-[#64748B] dark:text-[#666666] block font-mono">INR • Settled</span>
          </div>
        </div>

        {/* Buyer Request */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono text-[#64748B] dark:text-[#888888] uppercase block font-medium">
            Buyer Request
          </span>
          <div className="p-3 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] text-[#111827] dark:text-[#EDEDED] italic">
            "{passport.buyer_request}"
          </div>
        </div>

        {/* Why Selected */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-[#64748B] dark:text-[#888888] uppercase block font-medium">
            Why Selected ({passport.products_evaluated_count} Products Evaluated)
          </span>
          <div className="p-3 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-1.5">
            {passport.why_selected.map((reason, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[#111827] dark:text-[#EDEDED]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-[#00C48C] shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
            {passport.trade_offs && (
              <div className="pt-2 mt-2 border-t border-[#E2E4E8] dark:border-[#1F1F1F] text-[#D97706] dark:text-[#F5A623] text-[11px] flex items-start gap-1.5">
                <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FEF3C7] dark:bg-[#F5A623]/10 border border-[#FDE68A] dark:border-[#F5A623]/20">
                  Trade-off:
                </span>
                <span>{passport.trade_offs}</span>
              </div>
            )}
          </div>
        </div>

        {/* Authorization Checks */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-[#64748B] dark:text-[#888888] uppercase block font-medium">
            Merchant Policy Engine Authorization
          </span>
          <div className="p-3 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {passport.authorization_summary.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[#111827] dark:text-[#EDEDED]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-[#00C48C] shrink-0" />
                <span className="truncate">{item.label}: <strong className="text-[#111827] dark:text-white">PASS</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Confirmation */}
        <div className="p-3.5 rounded-xl bg-[#ECFDF5] dark:bg-black border border-[#A7F3D0] dark:border-[#00C48C]/30 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-[#059669] dark:text-[#00C48C] font-bold">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Razorpay Payment Captured</span>
            </div>
            <p className="text-[10px] text-[#64748B] dark:text-[#666666] font-mono">
              Order: {passport.razorpay_order_id || "rzp_mock"} • Payment: {passport.razorpay_payment_id || "pay_mock"}
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-[#00C48C]/10 text-[#059669] dark:text-[#00C48C] font-bold font-mono text-xs border border-[#A7F3D0] dark:border-[#00C48C]/20">
            {passport.payment_status}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-[#F8F9FA] dark:bg-[#111111] p-3 border-t border-[#E2E4E8] dark:border-[#1F1F1F] text-center text-[10px] text-[#64748B] dark:text-[#666666] font-mono">
        Generated from immutable decision ledger facts at {new Date(passport.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
