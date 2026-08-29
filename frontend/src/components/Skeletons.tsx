"use client";

export function CandidateSkeletonGrid() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E2E4E8] dark:border-[#1A1A1A] pb-3">
          <div className="h-4 w-44 bg-[#E2E4E8] dark:bg-[#1F1F1F] rounded"></div>
          <div className="h-8 w-36 bg-[#E2E4E8] dark:bg-[#1F1F1F] rounded-md"></div>
        </div>

        {/* Candidate Cards Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-14 bg-[#E2E4E8] dark:bg-[#1F1F1F] rounded"></div>
                <div className="h-4 w-16 bg-[#E2E4E8] dark:bg-[#1F1F1F] rounded"></div>
              </div>
              <div className="h-4 w-40 bg-[#CBD5E1] dark:bg-[#222222] rounded"></div>
              <div className="h-5 w-20 bg-[#E2E4E8] dark:bg-[#1F1F1F] rounded"></div>
              <div className="space-y-1.5 pt-2 border-t border-[#E2E4E8] dark:border-[#1A1A1A]">
                <div className="h-2.5 w-full bg-[#E2E4E8] dark:bg-[#1A1A1A] rounded"></div>
                <div className="h-2.5 w-4/5 bg-[#E2E4E8] dark:bg-[#1A1A1A] rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SimulationSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-[#0A0A0A] border border-[#0070F3]/30 space-y-3 animate-pulse shadow-sm">
      <div className="flex items-center justify-between border-b border-[#E2E4E8] dark:border-[#1A1A1A] pb-2 text-xs font-mono text-[#0070F3] font-semibold">
        <span>Evaluating Deterministic Rules...</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0070F3]/10">SCANNING</span>
      </div>

      <div className="space-y-2">
        {[
          "Agent Status & Permissions Check",
          "AI Purchasability & Stock Check",
          "Category Policy Validation",
          "Spending Limit Boundary Check"
        ].map((step, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1A1A1A] text-xs text-[#64748B] dark:text-[#888888]"
          >
            <span>{step}</span>
            <div className="h-3 w-10 bg-[#E2E4E8] dark:bg-[#1F1F1F] rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeletonRows({ count = 5, cols = 7 }: { count?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, rIdx) => (
        <tr key={rIdx} className="animate-pulse border-b border-[#E2E4E8] dark:border-[#1A1A1A]">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="py-3 px-4">
              <div className="h-3 bg-[#E2E4E8] dark:bg-[#1F1F1F] rounded w-full max-w-[100px]"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-2 shadow-sm">
          <div className="h-3 w-24 bg-[#E2E4E8] dark:bg-[#1F1F1F] rounded"></div>
          <div className="h-6 w-32 bg-[#CBD5E1] dark:bg-[#222222] rounded"></div>
        </div>
      ))}
    </div>
  );
}
