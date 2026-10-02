"use client";

import { startTransition, useEffect, useRef } from "react";
import { completeLogin } from "@/app/login/actions";

export default function FinishLoginPage() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    // Take the tokens out of the address bar and history before doing anything else
    window.history.replaceState(null, "", window.location.pathname);

    if (!accessToken || !refreshToken) {
      window.location.replace("/login?error=link");
      return;
    }
    startTransition(async () => {
      try {
        await completeLogin(accessToken, refreshToken);
      } catch {
        window.location.replace("/login?error=link");
      }
    });
  }, []);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <p className="text-sm text-slate-600">Connexion en cours…</p>
    </main>
  );
}
