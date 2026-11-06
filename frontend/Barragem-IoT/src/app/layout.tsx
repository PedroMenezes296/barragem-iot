import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppLayout from "@/components/layout/AppLayout";
import "@/styles/hidrolab.css";

export const metadata: Metadata = {
  title: "HidroLab | Monitoramento hídrico",
  description: "Dashboard acadêmico de monitoramento do reservatório experimental.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
