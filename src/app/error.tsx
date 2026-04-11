"use client";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps): JSX.Element {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4">
          <section className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 p-8 shadow-glow">
            <p className="text-xs uppercase tracking-[0.24em] text-amber-400">Runtime Error</p>
            <h1 className="mt-3 text-2xl font-semibold text-zinc-100">The workspace hit an unexpected failure.</h1>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              {error.message || "A rendering error interrupted the page. Retry the last action to continue."}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-lg bg-amber-500 px-5 py-2.5 font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
            >
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
