"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAllowedEmail } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) redirect("/login?error=email");
  if (!isAllowedEmail(email)) redirect("/login?error=denied");

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
