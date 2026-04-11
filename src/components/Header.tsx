"use client";

export default function Header() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-[52px] border-b border-surface-800 bg-surface-950/90 backdrop-blur-md">
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, #F59E0B 30%, #F59E0B 70%, transparent)"
        }}
      />
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
        <a href="#top" className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" stroke="#F59E0B" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1.5" fill="#F59E0B" />
            <line
              x1="12"
              y1="2"
              x2="12"
              y2="7"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="12"
              y1="17"
              x2="12"
              y2="22"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="2"
              y1="12"
              x2="7"
              y2="12"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="17"
              y1="12"
              x2="22"
              y2="12"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-surface-200">
              Smart Alloy Selector
            </span>
            <span
              className="rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-[0.08em] text-brand"
              style={{
                background: "linear-gradient(90deg, #1C1917, #292524)",
                borderColor: "#292524"
              }}
            >
              MET-QUEST&apos;26
            </span>
          </div>
        </a>

        <nav className="hidden items-center gap-6 text-[11px] text-zinc-500 md:flex">
          <a href="#query" className="transition-colors hover:text-zinc-100">
            How It Works
          </a>
          <a href="#predictor" className="transition-colors hover:text-zinc-100">
            Novel Alloy
          </a>
          <a href="#database" className="transition-colors hover:text-zinc-100">
            Database
          </a>
          <a href="#predictor" className="transition-colors hover:text-zinc-100">
            Predictor
          </a>
          <a
            href="https://github.com/akshatm24/mse_hackathon"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-zinc-100"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
