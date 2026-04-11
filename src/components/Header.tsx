"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#database", label: "Database" },
  { href: "#github-launch", label: "GitHub" }
];

function AtomMark(): JSX.Element {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 text-amber-400" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="5.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
      <path d="M16 2.8v5.4M16 23.8v5.4M2.8 16h5.4M23.8 16h5.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M6.1 6.1l3.8 3.8M22.1 22.1l3.8 3.8M25.9 6.1l-3.8 3.8M9.9 22.1l-3.8 3.8" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.4" strokeWidth="1.3" />
    </svg>
  );
}

export default function Header(): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="#top" className="flex items-center gap-3">
          <AtomMark />
          <div>
            <p className="text-sm font-semibold text-zinc-100 sm:text-base">Smart Alloy Selector</p>
            <div className="mt-1 inline-flex items-center rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-amber-400">
              MET-QUEST&apos;26
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-zinc-100">
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex rounded-lg border border-zinc-700 p-2 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 md:hidden"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <nav className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-zinc-300">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-zinc-800 px-3 py-2 transition-colors hover:border-zinc-600 hover:text-zinc-100"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
