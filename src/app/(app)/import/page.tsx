import Link from "next/link";
import ImportWizard from "@/components/ImportWizard";
import { getRegions } from "@/lib/leads";
import { createClient } from "@/lib/supabase/server";

export default async function ImportPage() {
  const supabase = await createClient();
  const regions = await getRegions(supabase);

  return (
    <div className="space-y-4">
      <div>
        <Link href="/leads" className="text-sm font-medium text-slate-600 hover:text-slate-900">
          ← Leads
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Importer un CSV</h1>
      </div>
      <ImportWizard regions={regions} />
    </div>
  );
}
