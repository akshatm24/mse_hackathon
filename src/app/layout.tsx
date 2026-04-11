import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Alloy Selector – MET-QUEST'26",
  description: "AI-powered material recommendation tool for engineers",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-950 text-surface-200">{children}</body>
    </html>
  );
}
