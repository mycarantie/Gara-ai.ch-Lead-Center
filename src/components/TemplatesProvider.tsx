"use client";

import { createContext, useContext } from "react";
import type { Template } from "@/lib/types";

const TemplatesContext = createContext<Template[]>([]);

export function useTemplates(): Template[] {
  return useContext(TemplatesContext);
}

export default function TemplatesProvider({
  templates,
  children,
}: {
  templates: Template[];
  children: React.ReactNode;
}) {
  return <TemplatesContext value={templates}>{children}</TemplatesContext>;
}
