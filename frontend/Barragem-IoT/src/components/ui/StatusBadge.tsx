import type { ReactNode } from "react";

export type StatusVariant = "ok" | "warn" | "bad" | "off";

export default function StatusBadge({ variant, children }: { variant: StatusVariant; children: ReactNode }) {
  return <span className={`pill ${variant}`}>{children}</span>;
}
