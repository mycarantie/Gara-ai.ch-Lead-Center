import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/labels";
import type { LeadStatus } from "@/lib/types";

export default function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-block shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
