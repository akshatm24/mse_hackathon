import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Alloy Selector – MET-QUEST'26",
  description:
    "AI-assisted engineering material selection with deterministic scoring, charts, chat follow-ups, and a searchable 40+ material database.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
