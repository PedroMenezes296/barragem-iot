"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Footer from "./Footer";

const TITLES: Record<string, string> = {
  "/": "Visão geral",
  "/historico": "Histórico",
  "/meteorologia": "Meteorologia",
  "/alertas": "Alertas",
};

const mediaQuery = "(prefers-color-scheme: dark)";
function subscribeToTheme(onChange: () => void) {
  const media = window.matchMedia(mediaQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
function getSystemTheme() {
  return window.matchMedia(mediaQuery).matches;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const systemDark = useSyncExternalStore(subscribeToTheme, getSystemTheme, () => false);
  const [themeOverride, setThemeOverride] = useState<boolean | null>(null);
  const dark = themeOverride ?? systemDark;

  return (
    <div className={`hl${dark ? " dark" : ""}`}>
      <Sidebar dark={dark} onToggleTheme={() => setThemeOverride((value) => !(value ?? systemDark))} />
      <main>
        <Header page={TITLES[pathname ?? "/"] ?? "HidroLab"} />
        <div className="body">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
