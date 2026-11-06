"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { PAGINAS } from "@/data/paginas";

const ROUTES: Record<(typeof PAGINAS)[number], Route> = {
  "Visão geral": "/",
  Histórico: "/historico",
  Meteorologia: "/meteorologia",
  Alertas: "/alertas",
};

const ICON_PATHS: Record<(typeof PAGINAS)[number], string> = {
  "Visão geral": "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  Histórico: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  Meteorologia: "M20 16.5a4 4 0 0 0-.8-7.9A6 6 0 0 0 7.5 7a4.5 4.5 0 0 0-.2 9h12.7Z",
  Alertas: "m12 3 9 17H3l9-17Zm0 6v5m0 3h.01",
};

function PageIcon({ page }: { page: (typeof PAGINAS)[number] }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={ICON_PATHS[page]} /></svg>;
}

function ThemeIcon({ dark }: { dark: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={dark ? "M20.5 15A8.5 8.5 0 0 1 9 3.5 8.5 8.5 0 1 0 20.5 15Z" : "M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.42 1.42M7.06 16.94l-1.42 1.42m12.72 0-1.42-1.42M7.06 7.06 5.64 5.64M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"} /></svg>;
}

export default function Sidebar({ dark, onToggleTheme }: { dark: boolean; onToggleTheme: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="sidebar" aria-label="Principal">
      <div className="brand"><span className="mark">H</span><div><b>HidroLab</b><small>Monitoramento hídrico</small></div></div>
      <div className="grp">Reservatório experimental</div>
      <div className="nav-links">
        {PAGINAS.map((item) => <Link className="nav-link" key={item} href={ROUTES[item]} aria-current={pathname === ROUTES[item] ? "page" : undefined}><PageIcon page={item} /><span>{item}</span></Link>)}
      </div>
      <div className="aside-note"><b>Projeto acadêmico</b>Instrumentação e aquisição de dados de um reservatório. Ambiente de demonstração.</div>
      <button className="theme" onClick={onToggleTheme} type="button"><ThemeIcon dark={dark} /><span>Tema {dark ? "escuro" : "claro"} · alternar</span></button>
      <div className="ver">HidroLab · versão 1.0</div>
    </nav>
  );
}
