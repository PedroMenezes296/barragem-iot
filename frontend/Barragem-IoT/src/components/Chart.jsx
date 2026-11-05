import { useMemo, useState } from "react";
import { fmt, hhmm, dmy, pad } from "../data/leituras";

export const SERIES_NIVEL = [
  { key: "ult", label: "Ultrassônico", unit: "cm" },
  { key: "res", label: "Resistivo", unit: "cm", dash: "6 4" },
];

/* Gráfico de linhas em SVG, sem dependências. rows: do mais antigo para o mais novo. */
function Chart({ rows, series, color, cursorState }) {
  const W = 720, H = 240, L = 44, R = 12, T = 10, B = 26;
  const [cur, setCur] = cursorState;
  const vals = rows.flatMap((r) => series.map((s) => r[s.key])).filter((v) => v != null);
  const lo = Math.floor(Math.min(...vals) / 5) * 5 - 5;
  const hi = Math.ceil(Math.max(...vals) / 5) * 5 + 5;
  const n = rows.length;
  const x = (i) => L + (i / Math.max(n - 1, 1)) * (W - L - R);
  const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = [0, 1, 2, 3, 4].map((k) => lo + ((hi - lo) * k) / 4);
  const xt = [0, 1, 2, 3].map((k) => Math.round(((n - 1) * k) / 3));
  const dia = (r) =>
    (rows[n - 1].t - rows[0].t > 36e5 * 30 ? `${pad(r.t.getDate())}/${pad(r.t.getMonth() + 1)} ` : "") + hhmm(r.t);

  // quebra a linha onde não há leitura (nunca desenha zero)
  const paths = (key) => {
    const segs = []; let c = [];
    rows.forEach((r, i) => {
      if (r[key] == null) { if (c.length) segs.push(c); c = []; }
      else c.push([x(i), y(r[key])]);
    });
    if (c.length) segs.push(c);
    return segs;
  };

  const move = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - b.left) / b.width) * W;
    setCur(Math.max(0, Math.min(n - 1, Math.round(((px - L) / (W - L - R)) * (n - 1)))));
  };

  return (
    <svg className="ch" viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onPointerLeave={() => setCur(null)} role="img" aria-label="Gráfico de leituras">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={L - 6} y={y(v) + 4} textAnchor="end">{Math.round(v)}</text>
        </g>
      ))}
      {xt.map((i, k) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor={k === 0 ? "start" : k === xt.length - 1 ? "end" : "middle"}>{dia(rows[i])}</text>
      ))}
      {series.map((s) => paths(s.key).map((seg, k) =>
        seg.length === 1
          ? <circle key={s.key + k} cx={seg[0][0]} cy={seg[0][1]} r="2.5" fill={s.color || color} />
          : <path key={s.key + k} d={"M" + seg.map((p) => p.join(" ")).join("L")} fill="none" stroke={s.color || color} strokeWidth="2" strokeDasharray={s.dash} strokeLinejoin="round" />
      ))}
      {cur != null && <line x1={x(cur)} x2={x(cur)} y1={T} y2={H - B} stroke="var(--mute)" strokeDasharray="3 3" />}
      {cur != null && series.map((s) => rows[cur][s.key] != null && (
        <circle key={s.key} cx={x(cur)} cy={y(rows[cur][s.key])} r="4" fill="var(--panel)" stroke={s.color || color} strokeWidth="2" />
      ))}
    </svg>
  );
}

/* Card com legenda, gráfico e linha de leitura sempre visível. rows: mais recente primeiro. */
export function ChartCard({ title, unit, rows, series, color, noteExtra }) {
  const cs = useState(null);
  const asc = useMemo(() => [...rows].reverse(), [rows]);
  const idx = cs[0] ?? asc.length - 1;
  const r = asc[idx];
  return (
    <section className="card">
      <h3><span>{title}</span><span>{unit}</span></h3>
      <div className="leg">
        {series.map((s) => (
          <span key={s.key}><i className={s.dash ? "d" : ""} style={{ borderTopColor: s.color || color }} />{s.label}</span>
        ))}
      </div>
      <Chart rows={asc} series={series} color={color} cursorState={cs} />
      <div className="readout" aria-live="polite">
        <span>{dmy(r.t)} <b>{hhmm(r.t)}</b></span>
        {series.map((s) => (
          <span key={s.key}>{s.label}:{" "}
            <b style={{ color: s.color || color }}>
              {r[s.key] == null ? (s.key === "res" && !r.calibrado ? "Não calibrado" : "Sem leitura") : `${fmt(r[s.key])} ${s.unit}`}
            </b>
          </span>
        ))}
      </div>
      <p className="note">{noteExtra}</p>
    </section>
  );
}
