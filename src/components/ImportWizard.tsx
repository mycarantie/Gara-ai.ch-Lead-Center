"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useState, useTransition } from "react";
import { importLeads } from "@/app/(app)/import/actions";
import {
  IMPORT_FIELDS,
  type ImportField,
  type ImportResult,
  type ImportRow,
  matchField,
} from "@/lib/csv";

const BATCH_SIZE = 300;
const PREVIEW_ROWS = 10;

const fieldClass =
  "block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900";
const sectionClass = "rounded-xl border border-slate-200 bg-white p-4";

// Excel often saves CSV as Windows-1252; fall back to it when the file is not valid UTF-8
async function readText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count > 1 ? many : one}`;
}

export default function ImportWizard({ regions }: { regions: string[] }) {
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, ImportField | "">>({});
  const [region, setRegion] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFile(file: File | undefined) {
    setError(null);
    setResult(null);
    if (!file) return;

    const parsed = Papa.parse<Record<string, string>>(await readText(file), {
      header: true,
      skipEmptyLines: "greedy",
    });
    const columns = (parsed.meta.fields ?? []).filter((column) => column.trim());
    if (columns.length === 0 || parsed.data.length === 0) {
      setHeaders([]);
      setRows([]);
      setError("Fichier vide ou illisible. Il faut une ligne d'en-têtes puis une ligne par garage.");
      return;
    }

    const used = new Set<string>();
    const initial: Record<string, ImportField | ""> = {};
    for (const column of columns) {
      const field = matchField(column);
      initial[column] = field && !used.has(field) ? field : "";
      if (field) used.add(field);
    }

    setFileName(file.name);
    setHeaders(columns);
    setRows(parsed.data);
    setMapping(initial);
  }

  const mappedFields = IMPORT_FIELDS.filter((field) => Object.values(mapping).includes(field.key));
  const hasName = mappedFields.some((field) => field.key === "garage_name");

  function mapRow(row: Record<string, string>): ImportRow {
    const mapped: ImportRow = {};
    for (const header of headers) {
      const field = mapping[header];
      if (field) mapped[field] = row[header] ?? "";
    }
    return mapped;
  }

  function runImport() {
    setError(null);
    startTransition(async () => {
      const total: ImportResult = { imported: 0, updated: [], duplicates: [], errors: [] };
      try {
        for (let start = 0; start < rows.length; start += BATCH_SIZE) {
          const batch = rows.slice(start, start + BATCH_SIZE).map(mapRow);
          // +2: line 1 is the header row
          const part = await importLeads(batch, region, start + 2);
          total.imported += part.imported;
          total.updated.push(...part.updated);
          total.duplicates.push(...part.duplicates);
          total.errors.push(...part.errors);
        }
        setResult(total);
      } catch {
        setError("L'import a échoué en cours de route. Relancez-le : les garages déjà présents ne seront pas dupliqués.");
      }
    });
  }

  function reset() {
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    setError(null);
  }

  if (result) {
    // Errors first, then what was filled in, then the plain duplicates
    const details = [
      ...result.errors.map((row) => ({ ...row, kind: "Erreur", tone: "text-red-700" })),
      ...result.updated.map((row) => ({ ...row, kind: "Complété", tone: "text-emerald-700" })),
      ...result.duplicates.map((row) => ({ ...row, kind: "Doublon", tone: "text-slate-600" })),
    ];

    return (
      <div className="space-y-4">
        <section className={sectionClass}>
          <p role="status" className="text-base font-semibold text-slate-900">
            {plural(result.imported, "importé", "importés")},{" "}
            {plural(result.updated.length, "complété", "complétés")},{" "}
            {plural(result.duplicates.length, "doublon ignoré", "doublons ignorés")},{" "}
            {plural(result.errors.length, "erreur", "erreurs")}
          </p>
          {details.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 text-sm">
              {details.map((row) => (
                <li key={`${row.kind}-${row.line}`} className="py-2">
                  <span className="font-medium text-slate-900">
                    Ligne {row.line}
                    {row.name ? ` — ${row.name}` : ""}
                  </span>
                  <span className={`ml-2 ${row.tone}`}>
                    {row.kind} : {row.reason}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 active:bg-slate-100 md:flex-none"
          >
            Importer un autre fichier
          </button>
          <Link
            href="/leads"
            className="flex-1 rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white active:bg-slate-700 md:flex-none"
          >
            Voir les leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className={sectionClass}>
        <label className="block text-sm font-semibold text-slate-900">
          Fichier CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => onFile(event.target.files?.[0])}
            className="mt-2 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white"
          />
        </label>
        <p className="mt-2 text-sm text-slate-500">
          Une ligne d&apos;en-têtes, puis un garage par ligne. Minimum : nom du garage et téléphone.
        </p>
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {headers.length > 0 && (
        <>
          <section className={sectionClass}>
            <h2 className="text-sm font-semibold text-slate-900">
              Colonnes de « {fileName} » ({plural(rows.length, "ligne", "lignes")})
            </h2>
            <div className="mt-3 space-y-2">
              {headers.map((header) => (
                <label key={header} className="grid grid-cols-2 items-center gap-2 text-sm">
                  <span className="min-w-0 break-words font-medium text-slate-700">{header}</span>
                  <select
                    value={mapping[header] ?? ""}
                    onChange={(event) =>
                      setMapping({ ...mapping, [header]: event.target.value as ImportField | "" })
                    }
                    className={fieldClass}
                  >
                    <option value="">Ignorer</option>
                    {IMPORT_FIELDS.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            {!hasName && (
              <p className="mt-3 text-sm font-medium text-red-700">
                Associez une colonne au champ « Nom du garage » pour pouvoir importer.
              </p>
            )}
          </section>

          <section className={sectionClass}>
            <label className="block text-sm font-semibold text-slate-900">
              Région pour tout l&apos;import
              <input
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                list="import-regions"
                placeholder="Riviera – Vevey"
                autoComplete="off"
                className={`mt-2 font-normal ${fieldClass}`}
              />
            </label>
            <datalist id="import-regions">
              {regions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            <p className="mt-2 text-sm text-slate-500">
              Appliquée aux lignes qui n&apos;ont pas leur propre région.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-sm font-semibold text-slate-900">
              Aperçu ({Math.min(PREVIEW_ROWS, rows.length)} premières lignes)
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {mappedFields.map((field) => (
                      <th key={field.key} className="whitespace-nowrap px-2 py-2 font-medium">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.slice(0, PREVIEW_ROWS).map((row, index) => {
                    const mapped = mapRow(row);
                    return (
                      <tr key={index}>
                        {mappedFields.map((field) => (
                          <td key={field.key} className="max-w-48 truncate px-2 py-2">
                            {mapped[field.key]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <button
            type="button"
            onClick={runImport}
            disabled={pending || !hasName}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-base font-semibold text-white active:bg-slate-700 disabled:opacity-40 md:w-auto md:px-8"
          >
            {pending ? "Import en cours…" : `Importer ${plural(rows.length, "ligne", "lignes")}`}
          </button>
        </>
      )}
    </div>
  );
}
