"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Sun,
  Moon,
  FileText, 
  Sliders, 
  Users, 
  Layers, 
  Activity
} from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("anton_theme");
    if (stored === "light") {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    } else {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("anton_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("anton_theme", "dark");
      setIsDark(true);
    }
  };

  const isMerchant = pathname.startsWith("/merchant");
  const isBuyer = pathname.startsWith("/buyer") || pathname === "/";

  const merchantLinks = [
    { href: "/merchant", label: "Overview", icon: Activity },
    { href: "/merchant/transactions", label: "Decision Ledger", icon: FileText },
    { href: "/merchant/policies", label: "Policy Studio", icon: Sliders },
    { href: "/merchant/agents", label: "Agent Access", icon: Users },
    { href: "/merchant/catalog", label: "Catalog", icon: Layers },
  ];

  return (
    <header className="bg-white/90 dark:bg-black/95 backdrop-blur-md border-b border-[#E2E4E8] dark:border-[#1F1F1F] text-[#111827] dark:text-white sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand Anton in Blue */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <span className="font-extrabold text-2xl tracking-wider text-[#0070F3] hover:text-[#3291FF] transition-colors">
                ANTON
              </span>
            </Link>
          </div>

          {/* Center Pill Switcher */}
          <div className="flex items-center p-1 rounded-full bg-[#EEF0F3] dark:bg-[#1E2025] border border-[#E2E4E8] dark:border-[#2D3139] shadow-sm">
            <Link
              href="/buyer"
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isBuyer
                  ? "bg-[#0070F3] text-white shadow-md"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white"
              }`}
            >
              AI Buyer
            </Link>
            <Link
              href="/merchant"
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isMerchant
                  ? "bg-[#0070F3] text-white shadow-md"
                  : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white"
              }`}
            >
              Merchant
            </Link>
          </div>

          {/* Right: Live Sandbox Badge + Light/Dark Toggle */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-xs font-medium text-[#059669] dark:text-[#00C48C] bg-[#ECFDF5] dark:bg-transparent px-3 py-1 rounded-full border border-[#A7F3D0] dark:border-transparent">
              <span className="w-2 h-2 rounded-full bg-[#10B981] dark:bg-[#00C48C] animate-pulse"></span>
              <span>Razorpay sandbox</span>
            </div>

            {/* Theme Toggle Button */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full bg-[#F1F3F5] dark:bg-[#1E2025] hover:bg-[#E5E7EB] dark:hover:bg-[#2A2D35] border border-[#E2E4E8] dark:border-[#2D3139] text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-white flex items-center justify-center transition-all shadow-sm"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-[#F5A623]" />
                ) : (
                  <Moon className="w-4 h-4 text-[#0070F3]" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Subnav for Merchant */}
        {isMerchant && (
          <div className="flex space-x-1.5 py-2 border-t border-[#E2E4E8] dark:border-[#1E2025] overflow-x-auto text-xs">
            {merchantLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full font-medium transition-colors ${
                    isActive
                      ? "bg-white dark:bg-[#1E2025] text-[#0070F3] border border-[#E2E4E8] dark:border-[#2D3139] shadow-sm font-semibold"
                      : "text-[#64748B] dark:text-[#888888] hover:text-[#111827] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1E2025]/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
