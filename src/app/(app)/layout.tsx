import Nav from "@/components/Nav";
import TemplatesProvider from "@/components/TemplatesProvider";
import { createClient } from "@/lib/supabase/server";
import type { Template } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("templates")
    .select("*")
    .order("sort_order")
    .order("name");

  return (
    <TemplatesProvider templates={(data ?? []) as Template[]}>
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24 pt-5 md:pb-10">
        {children}
      </main>
    </TemplatesProvider>
  );
}
