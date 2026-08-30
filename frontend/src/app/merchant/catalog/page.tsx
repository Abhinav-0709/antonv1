"use client";

import { useEffect, useState } from "react";
import { api, Product, AgentSpec } from "@/lib/api";
import { TableSkeletonRows } from "@/components/Skeletons";
import { 
  Layers, 
  Code, 
  PackageCheck,
  Tag
} from "lucide-react";

export default function MerchantCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [agentSpec, setAgentSpec] = useState<AgentSpec | null>(null);
  const [activeTab, setActiveTab] = useState<"visual" | "json">("visual");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, specData] = await Promise.all([
        api.getCatalog(),
        api.getAgentSpec(),
      ]);
      setProducts(prodData);
      setAgentSpec(specData);
    } catch (err) {
      console.error("Failed to load catalog data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen text-[#111827] dark:text-[#EDEDED] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E4E8] dark:border-[#1F1F1F] pb-5">
          <div>
            <h1 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0070F3]" />
              Agent-Readable Merchant Catalog
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#888888] mt-0.5 font-sans">
              Machine-readable product specification with attributes, promotional deals, and purchase rules.
            </p>
          </div>

          {/* View Switcher */}
          <div className="flex items-center space-x-1 bg-[#EEF0F3] dark:bg-[#0A0A0A] p-1 rounded-xl border border-[#E2E4E8] dark:border-[#1F1F1F] self-start sm:self-auto shadow-sm">
            <button
              onClick={() => setActiveTab("visual")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "visual"
                  ? "bg-[#0070F3] text-white shadow-sm"
                  : "text-[#64748B] dark:text-[#888888] hover:text-[#111827] dark:hover:text-white"
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Visual Inventory ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("json")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "json"
                  ? "bg-[#0070F3] text-white shadow-sm"
                  : "text-[#64748B] dark:text-[#888888] hover:text-[#111827] dark:hover:text-white"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Agent Spec (JSON API)</span>
            </button>
          </div>
        </div>

        {activeTab === "visual" ? (
          <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-[#E2E4E8] dark:border-[#1F1F1F] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9FA] dark:bg-black text-[#64748B] dark:text-[#888888] uppercase text-[10px] border-b border-[#E2E4E8] dark:border-[#1F1F1F] font-mono">
                  <tr>
                    <th className="py-3 px-3.5">ID</th>
                    <th className="py-3 px-3.5">Product & Category</th>
                    <th className="py-3 px-3.5">Price & Deals</th>
                    <th className="py-3 px-3.5">Stock</th>
                    <th className="py-3 px-3.5">Agent Buy</th>
                    <th className="py-3 px-3.5">Key Attributes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E4E8] dark:divide-[#1A1A1A] font-mono">
                  {loading && products.length === 0 ? (
                    <TableSkeletonRows count={8} cols={6} />
                  ) : (
                    products.map((p) => {
                      const dealTag = p.attributes?.deal_tag || p.deal_tag;

                      return (
                        <tr key={p.id} className="hover:bg-[#F8F9FA] dark:hover:bg-[#111111] transition-colors">
                          <td className="py-3 px-3.5 text-[#64748B] dark:text-[#888888]">
                            {p.id}
                          </td>
                          <td className="py-3 px-3.5 font-sans">
                            <div className="font-bold text-[#111827] dark:text-white text-xs">{p.name}</div>
                            <span className="text-[10px] text-[#0070F3] font-mono font-semibold">{p.category}</span>
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="font-bold text-[#111827] dark:text-white block">
                              ₹{p.price.toLocaleString("en-IN")}
                            </span>
                            {dealTag && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#FEF3C7] dark:bg-[#F5A623]/10 text-[#D97706] dark:text-[#F5A623] text-[9px] font-sans font-semibold mt-0.5 border border-[#FDE68A] dark:border-[#F5A623]/20">
                                <Tag className="w-2.5 h-2.5" />
                                <span className="truncate max-w-[120px]">{dealTag}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="text-[#111827] dark:text-[#EDEDED] text-xs">
                              {p.stock} units
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            {p.agent_purchasable ? (
                              <span className="text-[#059669] dark:text-[#00C48C] font-bold text-[11px]">
                                YES
                              </span>
                            ) : (
                              <span className="text-[#DC2626] dark:text-[#EE0000] font-bold text-[11px]">
                                NO
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-[10px] font-sans text-[#64748B] dark:text-[#888888] max-w-[240px]">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(p.attributes || {}).map(([k, v]) => {
                                if (k === "deal_tag" || k === "original_price" || k === "discount_percent") return null;
                                return (
                                  <span
                                    key={k}
                                    className="px-1.5 py-0.5 rounded-md bg-[#F0F2F5] dark:bg-black border border-[#E2E4E8] dark:border-[#1F1F1F] text-[#111827] dark:text-[#EDEDED]"
                                  >
                                    {k}: <strong>{String(v)}</strong>
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] space-y-2.5 font-mono shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#888888] border-b border-[#E2E4E8] dark:border-[#1A1A1A] pb-2">
              <span>GET /api/catalog/agent-spec</span>
              <span className="text-[#059669] dark:text-[#00C48C] font-bold">200 OK</span>
            </div>
            <pre className="p-4 rounded-xl bg-[#F8F9FA] dark:bg-black border border-[#E2E4E8] dark:border-[#1A1A1A] text-[#111827] dark:text-[#EDEDED] text-xs overflow-x-auto max-h-[500px] leading-relaxed">
              {JSON.stringify(agentSpec, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
