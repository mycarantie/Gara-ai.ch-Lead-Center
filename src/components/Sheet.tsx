"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

// Bottom sheet on phones, centered dialog on desktop.
export default function Sheet({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-full w-full flex-col rounded-t-2xl bg-white md:max-w-lg md:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="truncate text-sm text-slate-600">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 active:bg-slate-100"
          >
            Fermer
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4">{children}</div>

        {footer && (
          <div className="border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
