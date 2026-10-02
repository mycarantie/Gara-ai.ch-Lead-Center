import LeadForm from "@/components/LeadForm";
import { getRegions } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";
import { createLead } from "../actions";

export default async function NewLeadPage() {
  const supabase = await createClient();
  const regions = await getRegions(supabase);

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Nouveau lead</h1>
      <LeadForm regions={regions} action={createLead} cancelHref="/leads" />
    </>
  );
}
