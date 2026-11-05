/* Dados simulados e formatadores.
   Para ligar na API: substitua gerar() por GET /leituras (mais recente primeiro). */

export const BASE = new Date(2026, 10, 4, 14, 30);
export const pad = (n) => String(n).padStart(2, "0");
export const fmt = (v, d = 1) => (v == null ? "—" : v.toFixed(d).replace(".", ","));
export const hhmm = (t) => `${pad(t.getHours())}:${pad(t.getMinutes())}`;
export const dmy = (t) => `${pad(t.getDate())}/${pad(t.getMonth() + 1)}/${t.getFullYear()}`;

// seis leituras do layout do Figma; o restante é gerado de forma determinística
const FIXOS = [
  [46.4, 152.0, 68], [47.2, 152.0, 67], [47.9, 151.0, 67],
  null, [49.4, "nc", 66], [49.8, 149.0, 66],
];

function gerar() {
  const rows = [];
  for (let i = 0; i < 96 * 7; i++) {
    const t = new Date(BASE.getTime() - i * 15 * 60000);
    let dist = 46.4 + 0.55 * i + 3 * Math.sin(i / 9);
    let res = 200 - dist - 1.6 - 0.4 * Math.sin(i / 5);
    let um = Math.round(68 - i * 0.04 + 2 * Math.sin(i / 13));
    let calibrado = true;
    if (i < FIXOS.length) {
      const f = FIXOS[i];
      if (f === null) { dist = res = um = null; }
      else {
        dist = f[0]; um = f[2];
        if (f[1] === "nc") { res = null; calibrado = false; } else res = f[1];
      }
    }
    rows.push({
      t, dist,
      ult: dist == null ? null : +(200 - dist).toFixed(1),
      res: res == null ? null : +res.toFixed(1),
      um, calibrado,
    });
  }
  return rows; // mais recente primeiro
}

export const TODAS = gerar();
export const AGORA = new Date(BASE.getTime() + 2 * 60000);
