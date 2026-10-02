// Lead fields that a CSV column can be mapped to, with the header names matched automatically.
export const IMPORT_FIELDS = [
  { key: "garage_name", label: "Nom du garage", aliases: ["garage", "garagename", "nom", "name", "entreprise", "societe", "raisonsociale"] },
  { key: "contact_name", label: "Contact", aliases: ["contact", "contactname", "responsable", "personne"] },
  { key: "phone", label: "Téléphone", aliases: ["tel", "telephone", "phone", "mobile", "natel", "numero"] },
  { key: "email", label: "Email", aliases: ["email", "mail", "courriel"] },
  { key: "city", label: "Ville", aliases: ["ville", "city", "localite", "lieu"] },
  { key: "canton", label: "Canton", aliases: ["canton", "kanton"] },
  { key: "region", label: "Région", aliases: ["region"] },
  { key: "cars_online", label: "Voitures en ligne", aliases: ["carsonline", "voitures", "vehicules", "cars", "nbvoitures", "stock"] },
  { key: "is_franchise", label: "Concession de marque", aliases: ["isfranchise", "franchise", "concession"] },
  { key: "autoscout_url", label: "Lien AutoScout24", aliases: ["autoscouturl", "autoscout", "autoscout24", "lienautoscout"] },
  { key: "website", label: "Site web", aliases: ["website", "site", "siteweb", "web", "url"] },
  { key: "address", label: "Adresse", aliases: ["address", "adresse", "rue"] },
  { key: "current_system", label: "Système actuel", aliases: ["currentsystem", "systeme", "systemeactuel"] },
  { key: "notes", label: "Notes", aliases: ["notes", "note", "remarques", "commentaire"] },
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number]["key"];
export type ImportRow = Partial<Record<ImportField, string>>;

export interface ImportResult {
  imported: number;
  duplicates: { line: number; name: string; reason: string }[];
  errors: { line: number; name: string; reason: string }[];
}

function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function matchField(header: string): ImportField | "" {
  const normalized = normalizeHeader(header);
  const field = IMPORT_FIELDS.find((candidate) =>
    (candidate.aliases as readonly string[]).includes(normalized),
  );
  return field?.key ?? "";
}

// Spreadsheet apps run cells starting with these characters as formulas
export function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
