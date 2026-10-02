import { signOut } from "@/app/login/actions";
import PasswordSettings from "@/components/PasswordSettings";
import ProfileSettings from "@/components/ProfileSettings";
import TemplateManager from "@/components/TemplateManager";
import { createClient } from "@/lib/supabase/server";

const sectionClass = "rounded-xl border border-slate-200 bg-white p-4";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Réglages</h1>

      <section className={sectionClass}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Mon profil</h2>
        <ProfileSettings />
      </section>

      <section className={sectionClass}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Modèles de messages</h2>
        <TemplateManager />
      </section>

      <section className={sectionClass}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Mot de passe</h2>
        <PasswordSettings email={email ?? ""} />
      </section>

      <section className={sectionClass}>
        <h2 className="text-sm font-semibold text-slate-900">Compte</h2>
        <p className="mt-1 break-all text-sm text-slate-600">{email}</p>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 active:bg-slate-100 md:w-auto"
          >
            Se déconnecter
          </button>
        </form>
      </section>
    </div>
  );
}
