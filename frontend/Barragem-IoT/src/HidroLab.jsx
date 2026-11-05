"use client";

import { useEffect, useState } from "react";
import VisaoGeral from "./pages/VisaoGeral";
import Historico from "./pages/Historico";
import EmBreve from "./pages/EmBreve";
import "./styles/hidrolab.css";

const TELAS = ["Visão geral", "Histórico", "Meteorologia", "Alertas"];

export default function HidroLab() {
  const [tela, setTela] = useState("Visão geral");
  const [dark, setDark] = useState(false);

  // lê a preferência do sistema só no navegador (evita erro de hidratação no Next)
  useEffect(() => {
    setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  return (
    <div className={"hl" + (dark ? " dark" : "")}>
      <nav aria-label="Principal">
        <div className="brand">
          <span className="mark">H</span>
          <div><b>HidroLab</b><small>Monitoramento hídrico</small></div>
        </div>
        <div className="grp">Reservatório experimental</div>
        {TELAS.map((t) => (
          <a key={t} href="#" aria-current={t === tela ? "page" : undefined}
            onClick={(e) => { e.preventDefault(); setTela(t); }}>{t}</a>
        ))}
        <div className="aside-note"><b>Projeto acadêmico</b>Instrumentação e aquisição de dados de um reservatório. Ambiente de demonstração.</div>
        <button className="theme" onClick={() => setDark(!dark)}>Tema {dark ? "escuro" : "claro"} · alternar</button>
        <div className="ver">HidroLab · versão 1.0</div>
      </nav>

      <main>
        <header>
          <h1>{tela}</h1>
          <select aria-label="Dispositivo" defaultValue="arduino-mega-01"><option>arduino-mega-01</option></select>
          <span className="sp" />
          <span className="st">Conectado</span>
          <span className="badge">DADOS SIMULADOS</span>
        </header>
        <div className="body">
          {tela === "Visão geral" ? <VisaoGeral /> : tela === "Histórico" ? <Historico /> : <EmBreve nome={tela} />}
        </div>
        <footer>HidroLab · Projeto acadêmico · Leituras demonstrativas · Horário de Brasília (UTC−3) · O selo de simulação é removido quando a API real está ativa.</footer>
      </main>
    </div>
  );
}
