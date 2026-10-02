import { sendMagicLink } from "./actions";

const ERRORS: Record<string, string> = {
  denied: "Accès refusé",
  email: "Veuillez saisir votre adresse e-mail.",
  send: "Impossible d'envoyer le lien. Réessayez dans quelques minutes.",
  link: "Lien invalide ou expiré. Demandez un nouveau lien.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;
  const sent = searchParams.sent === "1";
  const errorKey = typeof searchParams.error === "string" ? searchParams.error : "";
  const error = ERRORS[errorKey];

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900">Lead Center</h1>
        <p className="mt-1 text-sm text-slate-600">
          Connexion par lien magique envoyé par e-mail.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        {sent ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            Lien envoyé. Ouvrez l&apos;e-mail sur cet appareil et touchez le lien
            pour vous connecter.
          </p>
        ) : (
          <form action={sendMagicLink} className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-slate-700" htmlFor="email">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="vous@exemple.ch"
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none focus:border-slate-900"
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-base font-semibold text-white active:bg-slate-700"
            >
              Recevoir le lien
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
