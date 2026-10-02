"use server";

import { createClient as createPlainClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAllowedEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email) redirect("/login?error=email");
  if (!isAllowedEmail(email)) redirect("/login?error=denied");
  if (!password) redirect("/login?error=password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=credentials");

  redirect("/");
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) redirect("/login?error=email");
  if (!isAllowedEmail(email)) redirect("/login?error=denied");

  // The implicit flow keeps the link usable in any browser: a phone's mail app often opens
  // links in a different browser from the one that requested them, which the PKCE flow rejects.
  const supabase = createPlainClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) {
    console.error("signInWithOtp failed:", error.message);
    redirect("/login?error=send");
  }
  redirect("/login?sent=1");
}

// Called by /auth/finish with the tokens Supabase put in the URL fragment.
export async function completeLogin(accessToken: string, refreshToken: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.setSession({
    access_token: String(accessToken),
    refresh_token: String(refreshToken),
  });
  if (error || !data.user) redirect("/login?error=link");

  if (!isAllowedEmail(data.user.email)) {
    await supabase.auth.signOut();
    redirect("/login?error=denied");
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
