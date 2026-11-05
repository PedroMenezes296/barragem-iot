import { useState } from "react";
import { ChartCard, SERIES_NIVEL } from "../components/Chart";
import { TODAS, fmt, hhmm, dmy } from "../data/leituras";

const PERIODOS = { "6 h": 24, "24 h": 96, "7 dias": 96 * 7 };
const POR_PAGINA = 8;

export default function Historico() {
  const [per, setPer] = useState("6 h");
  const [pg, setPg] = useState(1);

  const rows = TODAS.slice(0, PERIODOS[per]);
  const pages = Math.ceil(rows.length / POR_PAGINA);
  const page = Math.min(pg, pages);
  const vis = rows.slice((page - 1) * POR_PAGINA, page * POR_PAGINA);
  const intervalo = `${dmy(rows[rows.length - 1].t)} · ${hhmm(rows[rows.length - 1].t)}–${hhmm(rows[0].t)}`;

  return (
    <>
      <div>
        <h2 className="t">Histórico de leituras</h2>
        <p className="lead">Evolução do nível e da umidade ao longo do tempo.</p>
      </div>

      <section className="card filters">
        <div>
          <label>Período</label>
          <div className="seg">
            {Object.keys(PERIODOS).map((p) => (
              <button key={p} aria-pressed={per === p} onClick={() => { setPer(p); setPg(1); }}>{p}</button>
            ))}
            <button disabled title="Disponível quando a API real estiver ativa">Personalizado</button>
          </div>
        </div>
        <div><label>Intervalo exibido</label><div style={{ padding: "6px 0" }}>{intervalo}</div></div>
        <div><label>Dispositivo</label><select defaultValue="arduino-mega-01"><option>arduino-mega-01</option></select></div>
      </section>

      <ChartCard title="Nível da água" unit="cm" rows={rows} series={SERIES_NIVEL} color="var(--acc)"
        noteExtra="Sem leitura: quebra nas duas séries. Resistivo não calibrado: sem ponto no gráfico, nunca zero." />
      <ChartCard title="Umidade do ar" unit="%" rows={rows} color="var(--hum)"
        series={[{ key: "um", label: "Umidade do ar", unit: "%", color: "var(--hum)" }]}
        noteExtra="Sensor ambiental DHT." />

      <section className="card">
        <h3><span>Leituras registradas</span><span>{rows.length} registros</span></h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Data</th><th>Hora</th><th>Dispositivo</th>
                <th className="n">Distância (cm)</th><th className="n">Nível ultrassônico (cm)</th>
                <th className="n">Nível resistivo (cm)</th><th className="n">Umidade (%)</th>
              </tr>
            </thead>
            <tbody>
              {vis.map((r) => (
                <tr key={+r.t}>
                  <td>{dmy(r.t)}</td><td>{hhmm(r.t)}:00</td><td>arduino-mega-01</td>
                  <td className="n">{fmt(r.dist)}</td>
                  <td className="n" style={{ color: "var(--acc)" }}>{fmt(r.ult)}</td>
                  <td className={"n" + (r.res == null && !r.calibrado ? " m" : "")} style={r.res != null ? { color: "var(--acc)" } : null}>
                    {r.res == null && !r.calibrado ? "Não calibrado" : fmt(r.res)}
                  </td>
                  <td className="n">{r.um ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">— Sem dados · Não calibrado: leitura sem referência válida de nível. Distância sensor → água não equivale ao nível da água.</p>
        <div className="pager">
          <span className="lab">{(page - 1) * POR_PAGINA + 1}–{Math.min(page * POR_PAGINA, rows.length)} de {rows.length}</span>
          <div>
            <button disabled={page === 1} onClick={() => setPg(page - 1)} aria-label="Página anterior">‹</button>
            {Array.from({ length: Math.min(pages, 5) }, (_, k) => k + 1).map((p) => (
              <button key={p} aria-current={p === page ? "page" : undefined} onClick={() => setPg(p)}>{p}</button>
            ))}
            <button disabled={page === pages} onClick={() => setPg(page + 1)} aria-label="Próxima página">›</button>
          </div>
        </div>
      </section>
    </>
  );
}
