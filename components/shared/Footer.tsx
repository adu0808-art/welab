export function Footer() {
  return (
    <footer className="mt-12 border-t border-border bg-brand-bg">
      <div className="container py-8 text-sm text-muted-foreground">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} WeLAB · 위례신도시 리빙랩 사무국</p>
          <p className="opacity-70">
            송파 · 성남 · 하남 3개 지자체 협력 운영
          </p>
        </div>
      </div>
    </footer>
  );
}
