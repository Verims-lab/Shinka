// Harmless foundation shell (Foundation package scope). Contains NO business data.
// Approved future customer navigation: Home · Calendar · Pattern; "You" via top-right profile icon.
import { UserRound } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-shinka-ivory text-shinka-ink flex flex-col">
      <header className="flex items-center justify-between px-6 pt-6">
        <span className="font-heading text-2xl tracking-wide text-shinka-plum">Shinka</span>
        <button
          type="button"
          aria-label="You (profile) — not available in this build"
          disabled
          className="h-11 w-11 rounded-full border border-shinka-line flex items-center justify-center text-shinka-muted"
        >
          <UserRound className="h-5 w-5" />
        </button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-shinka-muted mb-6">Foundation build</p>
        <h1 className="font-heading text-5xl leading-tight text-shinka-plum-deep max-w-md">
          Shinka is being prepared.
        </h1>
        <p className="mt-6 text-sm text-shinka-muted max-w-xs leading-relaxed">
          Daily content, Calendar and Pattern arrive in later packages. Nothing here is personalised yet.
        </p>
      </main>
      <nav aria-label="Future navigation (inactive)" className="grid grid-cols-3 border-t border-shinka-line bg-shinka-surface">
        {["Home", "Calendar", "Pattern"].map((label) => (
          <span key={label} className="h-14 flex items-center justify-center text-xs tracking-wide text-shinka-muted">
            {label}
          </span>
        ))}
      </nav>
    </div>
  );
}