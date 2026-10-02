"use client";

import { useCallback, useState } from "react";
import type { LogLead } from "@/lib/types";
import LogModal from "./LogModal";

export default function LogButton({
  lead,
  className,
  children,
}: {
  lead: LogLead;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open && <LogModal lead={lead} onClose={close} />}
    </>
  );
}
