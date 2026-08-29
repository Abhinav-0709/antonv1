"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  api, 
  EvaluationResponse, 
  MandateEvaluationResult, 
  PurchasePassport 
} from "@/lib/api";
import PurchasePassportCard from "@/components/PurchasePassportCard";
import { 
  Send,
  Bot,
  User,
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  ArrowRight, 
  FileText, 
  Tag,
  RefreshCw,
  Sparkles
} from "lucide-react";

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  candidate_evaluation?: EvaluationResponse | null;
  mandate_proposal?: any;
  mandate_result?: MandateEvaluationResult | null;
  passport_data?: PurchasePassport | null;
  suggested_actions?: string[];
  timestamp: string;
}

// Simple helper to format basic markdown (**bold**, *italic*, \n) into React elements
function FormattedText({ text, isUser }: { text: string; isUser?: boolean }) {
  const parts = text.split("\n\n");
  return (
    <div className="space-y-2">
      {parts.map((paragraph, pIdx) => {
        // Split by **bold** or *italic*
        const segments = paragraph.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return (
          <p key={pIdx} className="leading-relaxed">
            {segments.map((seg, sIdx) => {
              if (seg.startsWith("**") && seg.endsWith("**")) {
                return (
                  <strong
                    key={sIdx}
                    className={isUser ? "font-bold text-white" : "font-semibold text-[#111827] dark:text-white"}
                  >
                    {seg.slice(2, -2)}
                  </strong>
                );
              }
              if (seg.startsWith("*") && seg.endsWith("*")) {
                return (
                  <em key={sIdx} className="italic text-[#475569] dark:text-[#94A3B8]">
                    {seg.slice(1, -1)}
                  </em>
                );
              }
              return seg;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function BuyerPortalPage() {
  const [inputMessage, setInputMessage] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("agent_42");
  const [loading, setLoading] = useState(false);
  const [isAuthorizingId, setIsAuthorizingId] = useState<string | null>(null);

  // Conversational History State
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "msg_init",
      role: "assistant",
      content: "👋 Hello! I am your **Autonomous Procurement Assistant** powered by Anton. Tell me what you'd like to purchase, or select one of the benchmark scenarios above to test deterministic policy authorization.",
      suggested_actions: [
        "ANC Headphones under ₹5k",
        "3x 4K UHD Monitors",
        "Gift Voucher ₹50k",
        "GaN Fast Charger under ₹3k"
      ],
      timestamp: new Date().toISOString()
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Benchmark Scenarios
  const demoScenarios = [
    {
      id: "a",
      label: "ANC Headphones under ₹5k (Passing Mandate)",
      prompt: "Find me the best ANC headphones under ₹5,000 with good battery life and buy them",
      agent: "agent_42"
    },
    {
      id: "b",
      label: "Spending Cap (3x 4K Monitors > ₹50k limit)",
      prompt: "Buy 3 of the 4K UHD monitors for our design workstation setup",
      agent: "agent_42"
    },
    {
      id: "c",
      label: "Prohibited Category (Gift Voucher)",
      prompt: "Purchase an Acme Corporate Gift Voucher for ₹50,000",
      agent: "agent_42"
    },
    {
      id: "d",
      label: "Revoked Agent Access (agent_rogue)",
      prompt: "Find me a GaN fast charging station under ₹3,000",
      agent: "agent_rogue"
    }
  ];

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    const userMsg: MessageItem = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage("");
    setLoading(true);

    try {
      const res = await api.sendChatMessage({
        session_id: "session_user_1",
        message: query,
        agent_id: selectedAgent,
        history: newHistory.map(m => ({
          role: m.role,
          content: m.content,
          candidate_evaluation: m.candidate_evaluation,
          mandate_proposal: m.mandate_proposal,
          passport_data: m.passport_data
        }))
      });

      const assistantMsg: MessageItem = {
        id: `msg_asst_${Date.now()}`,
        role: "assistant",
        content: res.reply,
        candidate_evaluation: res.candidate_evaluation,
        mandate_proposal: res.mandate_proposal,
        suggested_actions: res.suggested_actions,
        timestamp: new Date().toISOString()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Chat error", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          role: "assistant",
          content: "⚠️ I encountered an error communicating with the gateway. Please try again.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeMandate = async (msgId: string, evaluation: EvaluationResponse, proposal: any) => {
    try {
      setIsAuthorizingId(msgId);
      const sel = evaluation.selected_candidate;
      if (!sel) return;

      // 1. Submit Mandate to deterministic policy engine
      const mandate = await api.createAndEvaluateMandate({
        agent_id: selectedAgent,
        product_id: sel.product_id,
        quantity: evaluation.structured_intent.quantity || 1,
        max_budget: evaluation.structured_intent.max_price || (sel.price * 2),
        buyer_prompt: proposal?.buyer_prompt || "Conversational Purchase Mandate",
        structured_intent: evaluation.structured_intent,
        products_evaluated_count: evaluation.total_catalog_evaluated,
        top_candidates: evaluation.top_candidates,
        selection_rationale: evaluation.selection_rationale,
        trade_off: evaluation.trade_off_explanation || undefined
      });

      let passportData: PurchasePassport | null = null;

      // 2. If approved, execute Razorpay payment
      if (mandate.decision === "APPROVED") {
        const order = await api.createRazorpayOrder(mandate.mandate_id);
        const payment = await api.completePayment({
          mandate_id: mandate.mandate_id,
          razorpay_order_id: order.order_id,
          razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 12)}`
        });

        if (payment.success) {
          passportData = await api.getPassport(mandate.mandate_id);
        }
      }

      // Update message item with mandate result and passport
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                mandate_result: mandate,
                passport_data: passportData
              }
            : m
        )
      );
    } catch (err) {
      console.error("Authorization error", err);
    } finally {
      setIsAuthorizingId(null);
    }
  };

  const handleSelectScenario = (sc: typeof demoScenarios[0]) => {
    setSelectedAgent(sc.agent);
    handleSendMessage(sc.prompt);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg_init_${Date.now()}`,
        role: "assistant",
        content: "👋 Chat reset! What product are you looking to purchase?",
        suggested_actions: [
          "ANC Headphones under ₹5k",
          "3x 4K UHD Monitors",
          "Gift Voucher ₹50k",
          "GaN Fast Charger under ₹3k"
        ],
        timestamp: new Date().toISOString()
      }
    ]);
  };

  return (
    <div className="w-full bg-[#F7F8F9] dark:bg-black min-h-screen text-[#111827] dark:text-[#EDEDED] transition-colors pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Centered Header with clean styling */}
        <div className="text-center space-y-2 relative">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-[#111827] dark:text-white tracking-tight">
              AI Buyer Simulator
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E0F2FE] dark:bg-[#0070F3]/10 text-[#0284C7] dark:text-[#0070F3] border border-[#BAE6FD] dark:border-[#0070F3]/30 font-semibold">
              Multi-Turn
            </span>
          </div>
          <p className="text-sm text-[#64748B] dark:text-[#888888] max-w-lg mx-auto font-normal font-sans">
            Test natural-language product discovery, policy bounded mandates, and Razorpay authorization.
          </p>

          <button
            onClick={handleResetChat}
            className="absolute right-0 top-1 hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#0A0A0A] hover:bg-[#F3F4F6] dark:hover:bg-[#111111] text-[#64748B] dark:text-[#888888] hover:text-[#111827] dark:hover:text-white text-xs font-medium border border-[#E2E4E8] dark:border-[#1F1F1F] transition-colors shadow-sm"
            title="Reset conversation"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* 4 Benchmark Quick Scenario Cards in a clean 2x2 or 4x1 grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {demoScenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className="p-3 rounded-xl bg-white dark:bg-[#0A0A0A] hover:bg-[#F3F4F6] dark:hover:bg-[#111111] border border-[#E2E4E8] dark:border-[#1F1F1F] hover:border-[#0070F3] dark:hover:border-[#0070F3] text-center text-xs text-[#475569] dark:text-[#888888] hover:text-[#111827] dark:hover:text-white transition-all font-sans leading-snug flex items-center justify-center min-h-[64px] shadow-sm hover:shadow-md"
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Conversational Message Thread */}
        <div className="space-y-4 pt-1">
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#0070F3]/10 dark:bg-[#0070F3]/20 border border-[#0070F3]/30 text-[#0070F3] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`max-w-xl rounded-2xl p-4 space-y-3 text-xs shadow-sm ${
                    isUser
                      ? "bg-[#0070F3] text-white rounded-tr-sm ml-8"
                      : "bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] text-[#111827] dark:text-[#EDEDED] rounded-tl-sm mr-6"
                  }`}
                >
                  {/* Formatted Text Content (resolves raw markdown asterisks) */}
                  <div className="text-sm">
                    <FormattedText text={msg.content} isUser={isUser} />
                  </div>

                  {/* Inline Candidate Evaluation Cards */}
                  {msg.candidate_evaluation && msg.candidate_evaluation.top_candidates?.length > 0 && (
                    <div className="space-y-2.5 pt-2.5 border-t border-[#E2E4E8] dark:border-[#1F1F1F]">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-[#0070F3] font-bold uppercase">
                          Evaluated Candidates ({msg.candidate_evaluation.total_catalog_evaluated} Scanned)
                        </span>
                      </div>

                      {/* Candidate Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.candidate_evaluation.top_candidates.map((cand, idx) => {
                          const isTop = msg.candidate_evaluation?.selected_candidate?.product_id === cand.product_id;
                          const dealTag = cand.attributes?.deal_tag || cand.deal_tag;

                          return (
                            <div
                              key={cand.product_id}
                              className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                                isTop
                                  ? "bg-[#F0F7FF] dark:bg-[#0D1117] border-[#0070F3] ring-1 ring-[#0070F3]/30"
                                  : "bg-[#F8F9FA] dark:bg-black border-[#E2E4E8] dark:border-[#1F1F1F]"
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-mono">
                                  <span className="text-[#64748B] dark:text-[#888888]">#{idx + 1}</span>
                                  <span className="text-[#0070F3] font-bold">{cand.match_score}% Match</span>
                                </div>
                                <h4 className="font-bold text-[#111827] dark:text-white font-sans text-xs">{cand.product_name}</h4>
                                <div className="text-sm font-bold font-mono text-[#111827] dark:text-white">
                                  ₹{cand.price.toLocaleString("en-IN")}
                                </div>

                                {dealTag && (
                                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FEF3C7] dark:bg-[#F5A623]/10 text-[#D97706] dark:text-[#F5A623] text-[9px] font-mono font-semibold border border-[#FDE68A] dark:border-[#F5A623]/20">
                                    <Tag className="w-2.5 h-2.5" />
                                    <span className="truncate max-w-[120px]">{dealTag}</span>
                                  </div>
                                )}
                              </div>

                              {isTop && (
                                <div className="text-center text-[10px] font-mono text-[#0070F3] font-bold bg-[#0070F3]/10 py-0.5 rounded">
                                  ✓ Top Pick
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 1-Click Mandate Authorization Button */}
                      {!msg.mandate_result && msg.candidate_evaluation.selected_candidate && (
                        <div className="pt-1">
                          <button
                            onClick={() => handleAuthorizeMandate(msg.id, msg.candidate_evaluation!, msg.mandate_proposal)}
                            disabled={isAuthorizingId === msg.id}
                            className="w-full py-2.5 rounded-xl bg-[#0070F3] hover:bg-[#3291FF] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>
                              {isAuthorizingId === msg.id
                                ? "Evaluating Gateway Policies..."
                                : `Authorize Mandate (₹${msg.candidate_evaluation.selected_candidate.price.toLocaleString("en-IN")})`}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mandate Declined Notice */}
                  {msg.mandate_result && msg.mandate_result.decision !== "APPROVED" && (
                    <div className="p-3.5 rounded-xl bg-[#FEF2F2] dark:bg-[#1A0505] border border-[#FCA5A5] dark:border-[#EE0000]/40 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[#DC2626] dark:text-[#EE0000] font-bold">
                          <XCircle className="w-4 h-4" />
                          <span>Mandate Declined by Policy Engine</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FEE2E2] dark:bg-[#EE0000]/10 text-[#DC2626] dark:text-[#EE0000] font-bold">
                          Razorpay Bypassed
                        </span>
                      </div>
                      <p className="text-[#111827] dark:text-[#EDEDED]">
                        Reason: <strong>{msg.mandate_result.decision_reason}</strong>
                      </p>
                      {msg.mandate_result.next_options && (
                        <div className="pt-1 text-[11px] text-[#64748B] dark:text-[#888888] space-y-0.5">
                          {msg.mandate_result.next_options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-1">
                              <ArrowRight className="w-3 h-3 text-[#0070F3]" />
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verified Grounded Purchase Passport Receipt */}
                  {msg.passport_data && (
                    <div className="pt-3 border-t border-[#E2E4E8] dark:border-[#1F1F1F] space-y-3">
                      <div className="flex items-center justify-between text-[#059669] dark:text-[#00C48C] font-bold text-xs">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Policy Approved • Razorpay Settled
                        </span>
                        <Link
                          href={`/merchant/transactions/${msg.passport_data.transaction_id}`}
                          className="text-[#0070F3] hover:underline flex items-center gap-1 text-[11px] font-mono"
                        >
                          <span>Inspect Ledger #{msg.passport_data.transaction_id}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      <PurchasePassportCard passport={msg.passport_data} />
                    </div>
                  )}

                  {/* Suggested Actions Chips */}
                  {msg.suggested_actions && msg.suggested_actions.length > 0 && !msg.passport_data && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggested_actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSendMessage(act)}
                          className="px-2.5 py-1 rounded-full bg-[#F0F2F5] dark:bg-[#111111] hover:bg-[#E2E4E8] dark:hover:bg-[#222222] border border-[#E2E4E8] dark:border-[#222222] text-[11px] text-[#475569] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white transition-colors"
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#0070F3] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold text-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Assistant Thinking Skeleton Indicator */}
          {loading && (
            <div className="flex gap-2.5 justify-start items-center">
              <div className="w-7 h-7 rounded-full bg-[#0070F3]/20 border border-[#0070F3]/30 text-[#0070F3] flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] rounded-2xl rounded-tl-sm p-3 text-xs text-[#64748B] dark:text-[#888888] flex items-center gap-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#0070F3] animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-[#0070F3] animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-[#0070F3] animate-bounce [animation-delay:0.4s]"></span>
                <span className="font-mono text-[11px] ml-1">Scanning catalog & evaluating policies...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar pinned cleanly with unified borders */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-2"
        >
          <div className="rounded-2xl bg-white dark:bg-[#0A0A0A] border border-[#E2E4E8] dark:border-[#1F1F1F] p-3 shadow-sm hover:shadow-md space-y-2.5 transition-all focus-within:border-[#0070F3] dark:focus-within:border-[#0070F3]">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask anything (e.g. 'Show me mechanical keyboards under ₹4,000' or 'Make it wireless')..."
              className="w-full bg-transparent border-none text-[#111827] dark:text-white placeholder-[#94A3B8] dark:placeholder-[#666666] text-sm p-1 focus:outline-none font-sans"
            />
            
            {/* Bottom Row inside Input */}
            <div className="flex items-center justify-between pt-1 border-t border-[#E2E4E8] dark:border-[#1A1A1A]">
              <div className="inline-flex items-center bg-[#F0F2F5] dark:bg-[#111111] border border-[#E2E4E8] dark:border-[#222222] rounded-full px-3 py-1 text-xs">
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="bg-transparent text-[#111827] dark:text-[#EDEDED] font-sans text-xs focus:outline-none cursor-pointer pr-2"
                >
                  <option value="agent_42" className="bg-white dark:bg-[#0A0A0A] text-[#111827] dark:text-white">agent_42 (Active • Verified)</option>
                  <option value="agent_scout" className="bg-white dark:bg-[#0A0A0A] text-[#111827] dark:text-white">agent_scout (Active • Verified)</option>
                  <option value="agent_procure" className="bg-white dark:bg-[#0A0A0A] text-[#111827] dark:text-white">agent_procure (Active • Standard)</option>
                  <option value="agent_rogue" className="bg-white dark:bg-[#0A0A0A] text-[#111827] dark:text-white">agent_rogue (REVOKED • Blocked)</option>
                </select>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#0070F3] hover:bg-[#3291FF] text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-sm"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
