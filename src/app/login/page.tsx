import Link from "next/link";
import { sendMagicLink, signInWithPassword } from "./actions";

const ERRORS: Record<string, string> = {
  denied: "Accès refusé",
  email: "Veuillez saisir votre adresse e-mail.",
  password: "Veuillez saisir votre mot de passe.",
  credentials: "E-mail ou mot de passe incorrect.",
  send: "Impossible d'envoyer le lien. Réessayez dans quelques minutes.",
  link: "Lien invalide ou expiré. Demandez un nouveau lien.",
};

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-slate-900";

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const sent = searchParams.sent === "1";
  const errorKey = typeof searchParams.error === "string" ? searchParams.error : "";
  const error = ERRORS[errorKey];

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900">Lead Center</h1>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        {sent ? (
          <>
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
              Lien envoyé. Ouvrez l&apos;e-mail et touchez le lien pour vous connecter, puis
              choisissez un mot de passe dans Réglages.
            </p>
            <Link href="/login" className="mt-4 inline-block text-sm font-medium text-slate-700 underline">
              Retour à la connexion
            </Link>
          </>
        ) : (
          <form action={signInWithPassword} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Adresse e-mail
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
                inputMode="email"
                placeholder="vous@exemple.ch"
                className={inputClass}
              />
            </label>
            {/* Not `required`: the e-mail link button below submits the same form without it */}
            <label className="block text-sm font-medium text-slate-700">
              Mot de passe
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-base font-semibold text-white active:bg-slate-700"
            >
              Se connecter
            </button>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600">
                Première connexion ou mot de passe oublié ?
              </p>
              <button
                type="submit"
                formAction={sendMagicLink}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 active:bg-slate-100"
              >
                Recevoir un lien de connexion par e-mail
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
