"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSetting, setSetting } from "@/lib/settings";

// Sets ?region= on the current page. With `remember`, the choice is kept in localStorage.
export default function RegionSelect({
  regions,
  value,
  remember = false,
}: {
  regions: string[];
  value: string;
  remember?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function go(region: string) {
    router.replace(region ? `${pathname}?region=${encodeURIComponent(region)}` : pathname, {
      scroll: false,
    });
  }

  useEffect(() => {
    if (!remember || value) return;
    const stored = getSetting("region");
    if (stored && regions.includes(stored)) go(stored);
    // Runs once on first display: restores the remembered region when the URL has none
  }, []);

  return (
    <select
      value={value}
      onChange={(event) => {
        if (remember) setSetting("region", event.target.value);
        go(event.target.value);
      }}
      aria-label="Région"
      className="block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-2.5 text-base text-slate-900 md:w-72"
    >
      <option value="">Toutes les régions</option>
      {regions.map((region) => (
        <option key={region} value={region}>
          {region}
        </option>
      ))}
    </select>
  );
}
