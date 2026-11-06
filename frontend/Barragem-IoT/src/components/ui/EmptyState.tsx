import type { ReactNode } from "react";

export default function EmptyState({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`empty${className ? ` ${className}` : ""}`}>{children}</div>;
}
