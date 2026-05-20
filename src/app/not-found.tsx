import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header (matches main layout) ── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <svg
              className="size-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            <span className="tracking-tight">SmartDash</span>
          </div>
        </div>
      </header>

      {/* ── 404 Content ── */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="mx-auto max-w-md text-center">
          {/* Large 404 */}
          <h1 className="mb-4 text-[8rem] font-bold leading-none tracking-tight text-primary/20 select-none">
            404
          </h1>

          {/* Title */}
          <h2 className="mb-2 text-xl font-semibold tracking-tight">
            Sayfa Bulunamadı
          </h2>

          {/* Description */}
          <p className="mb-8 text-sm text-muted-foreground">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            Test analizlerinize dönmek için aşağıdaki butonu kullanın.
          </p>

          {/* CTA */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Dashboard&apos;a Dön
          </Link>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        SmartDash &mdash; AI Destekli Test Analizi
      </footer>
    </div>
  );
}
