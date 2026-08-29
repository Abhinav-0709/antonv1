"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, PurchasePassport } from "@/lib/api";
import PurchasePassportCard from "@/components/PurchasePassportCard";
import { ArrowLeft, FileText, ArrowRight } from "lucide-react";

export default function BuyerPassportViewPage() {
  const params = useParams();
  const id = params.id as string;
  const [passport, setPassport] = useState<PurchasePassport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getPassport(id)
        .then((data) => setPassport(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen py-16 text-center text-[#64748B] dark:text-[#888888] font-mono text-xs">
        Loading Purchase Passport for {id}...
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen py-16 text-center space-y-3 font-mono">
        <h1 className="text-base font-bold text-[#111827] dark:text-white">Passport Not Found</h1>
        <p className="text-[#64748B] dark:text-[#888888] text-xs">Could not find a purchase passport for mandate/transaction {id}.</p>
        <Link href="/buyer" className="inline-block text-[#0070F3] text-xs hover:underline font-semibold">
          ← Back to AI Buyer
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen text-[#111827] dark:text-[#EDEDED] transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#E2E4E8] dark:border-[#1F1F1F] pb-4">
          <Link
            href="/buyer"
            className="inline-flex items-center gap-1 text-xs text-[#64748B] dark:text-[#888888] hover:text-[#111827] dark:hover:text-white transition-colors font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to AI Buyer</span>
          </Link>
          <Link
            href={`/merchant/transactions/${passport.transaction_id}`}
            className="inline-flex items-center gap-1 text-xs text-[#0070F3] hover:underline font-mono font-semibold"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Inspect Decision Ledger Record #{passport.transaction_id}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <PurchasePassportCard passport={passport} />
      </div>
    </div>
  );
}
