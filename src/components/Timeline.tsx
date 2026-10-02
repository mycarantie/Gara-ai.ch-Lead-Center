import { formatDateTime } from "@/lib/dates";
import { ACTIVITY_LABELS } from "@/lib/labels";
import type { Activity, ActivityType } from "@/lib/types";

const MESSAGE = "M4 5h16v11H9l-5 4z";
const PHONE =
  "M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z";
const MAIL = "M3 6h18v12H3zM3 7l9 7 9-7";

const ICONS: Record<ActivityType, { path: string; className: string }> = {
  whatsapp_sent: { path: MESSAGE, className: "bg-emerald-100 text-emerald-700" },
  whatsapp_received: { path: MESSAGE, className: "bg-emerald-600 text-white" },
  call_answered: { path: PHONE, className: "bg-sky-600 text-white" },
  call_no_answer: { path: PHONE, className: "bg-slate-100 text-slate-500" },
  email_sent: { path: MAIL, className: "bg-violet-100 text-violet-700" },
  email_received: { path: MAIL, className: "bg-violet-600 text-white" },
  demo: { path: "M3 6h12v12H3zM15 10l6-3v10l-6-3", className: "bg-amber-100 text-amber-700" },
  note: { path: "M6 3h9l4 4v14H6zM9 12h7M9 16h7M9 8h3", className: "bg-slate-100 text-slate-600" },
  status_change: { path: "M4 12h14M13 6l6 6-6 6", className: "bg-slate-800 text-white" },
};

export default function Timeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-500">Aucune activité pour l&apos;instant.</p>;
  }

  return (
    <ol className="space-y-4">
      {activities.map((activity) => {
        const icon = ICONS[activity.type];
        return (
          <li key={activity.id} className="flex gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${icon.className}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={icon.path} />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium text-slate-900">{ACTIVITY_LABELS[activity.type]}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {formatDateTime(activity.created_at)}
                </span>
              </p>
              {activity.summary && (
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">
                  {activity.summary}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
