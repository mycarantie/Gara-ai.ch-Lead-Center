"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "Aujourd'hui",
    icon: "M8 2v3M16 2v3M3.5 9h17M5 4h14a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5 4Zm4 10 2 2 4-4",
  },
  {
    href: "/leads",
    label: "Leads",
    icon: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  },
  {
    href: "/pipeline",
    label: "Pipeline",
    icon: "M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z",
  },
  {
    href: "/stats",
    label: "Stats",
    icon: "M4 20V10M10 20V4M16 20v-7M21 20H3",
  },
  {
    href: "/reglages",
    label: "Réglages",
    icon: "M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4M14 4v4M6 10v4M12 16v4",
  },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:static md:border-b md:border-t-0 md:pb-0"
    >
      <ul className="mx-auto flex max-w-5xl md:gap-1 md:px-4">
        {ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="min-w-0 flex-1 md:flex-none">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium md:h-12 md:flex-row md:gap-2 md:px-3 md:text-sm ${
                  active
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2.2 : 1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={item.icon} />
                </svg>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
