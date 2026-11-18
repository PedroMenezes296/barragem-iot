import type { Metadata } from "next";
import ThemeRegistry from "@/components/layout/ThemeRegistry";
import AppShell from "@/components/layout/AppShell";
import RuntimeShell from "@/components/layout/RuntimeShell";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "BarragemIot | Monitoramento hídrico",
  description: "Dashboard de monitoramento hídrico do BarragemIot.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeRegistry>
          <Suspense
            fallback={
              <AppShell sourceLabel="Carregando dados">
                <p>Carregando painel…</p>
              </AppShell>
            }
          >
            <RuntimeShell>{children}</RuntimeShell>
          </Suspense>
        </ThemeRegistry>
      </body>
    </html>
  );
}
