export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-md focus:border focus:border-line focus:bg-overlay focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-fg focus:shadow-md"
    >
      Skip to content
    </a>
  );
}
