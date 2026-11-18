import { connection } from "next/server";
import { usesSimulatedReadings } from "@/lib/api-config";
import AppShell from "./AppShell";

export default async function RuntimeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  return (
    <AppShell
      sourceLabel={
        usesSimulatedReadings()
          ? "Modo demonstração"
          : "Leituras API · demonstrações locais"
      }
    >
      {children}
    </AppShell>
  );
}
