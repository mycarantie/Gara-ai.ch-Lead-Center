import { notFound } from "next/navigation";
import LeadForm from "@/components/LeadForm";
import { getRegions } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";
import type { Lead } from "@/lib/types";
import { updateLead } from "../../actions";

export default async function EditLeadPage(props: PageProps<"/leads/[id]/edit">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data }, regions] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).maybeSingle(),
    getRegions(supabase),
  ]);
  if (!data) notFound();
  const lead = data as Lead;

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Modifier le lead</h1>
      <LeadForm
        lead={lead}
        regions={regions}
        action={updateLead.bind(null, lead.id)}
        cancelHref={`/leads/${lead.id}`}
      />
    </>
  );
}
