import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Anton — Safe, Gated Agent Commerce Gateway | Razorpay Track 01",
  description: "Merchant-side authorization and trust layer for AI buyers and Razorpay payments.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('anton_theme');
                if (stored === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="h-full flex flex-col antialiased bg-[#F7F8F9] dark:bg-black text-[#111827] dark:text-[#EDEDED] selection:bg-[#0070F3] selection:text-white">
        <Navigation />
        <main className="flex-1 overflow-y-auto bg-[#F7F8F9] dark:bg-black text-[#111827] dark:text-[#EDEDED]">
          {children}
        </main>
      </body>
    </html>
  );
}
