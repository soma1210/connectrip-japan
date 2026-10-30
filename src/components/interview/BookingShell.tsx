import type { ReactNode } from "react";

export function BookingShell({ children }: { children: ReactNode }) {
  return (
    <main className="interview-ui interview-applicant mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-8 sm:py-14">
      <header className="mb-7 border-b border-navy/15 pb-6 sm:mb-9">
        <p className="text-xs font-semibold tracking-[0.2em] text-navy">CONNECTRIP <span className="text-[#896a30]">JAPAN</span></p>
        <div className="mt-5 h-0.5 w-10 bg-gold" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-3xl tracking-tight sm:text-4xl">Guide Interview</h1>
        <p className="mt-2 text-sm text-navy/75">A conversation to start your journey with us.</p>
      </header>
      {children}
      <footer className="mt-7 text-center text-xs text-navy/70">Connectrip Japan · Guide recruitment</footer>
    </main>
  );
}
