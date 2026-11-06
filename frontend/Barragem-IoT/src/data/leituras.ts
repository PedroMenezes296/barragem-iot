import type { SensorReading } from "../types/leituras";

export const BASE = new Date("2026-11-04T14:30:00-03:00");

// Leituras representativas do protótipo; as demais são geradas de forma determinística.
const FIXOS: Array<readonly [number, number | "nc", number] | null> = [
  [46.4, 152, 68], [47.2, 152, 67], [47.9, 151, 67],
  null, [49.4, "nc", 66], [49.8, 149, 66],
];

interface SimulatedReading {
  t: Date;
  dist: number | null;
  ult: number | null;
  res: number | null;
  um: number | null;
  calibrado: boolean;
}

function gerar(): SimulatedReading[] {
  const rows: SimulatedReading[] = [];
  for (let i = 0; i < 96 * 7; i += 1) {
    const t = new Date(BASE.getTime() - i * 15 * 60000);
    let dist: number | null = 46.4 + 0.55 * i + 3 * Math.sin(i / 9);
    let res: number | null = 200 - dist - 1.6 - 0.4 * Math.sin(i / 5);
    let um: number | null = Math.round(68 - i * 0.04 + 2 * Math.sin(i / 13));
    let calibrado = true;
    if (i < FIXOS.length) {
      const fixo = FIXOS[i];
      if (fixo === null) { dist = res = um = null; }
      else {
        dist = fixo[0];
        um = fixo[2];
        if (fixo[1] === "nc") { res = null; calibrado = false; }
        else res = fixo[1];
      }
    }
    rows.push({ t, dist, ult: dist == null ? null : +(200 - dist).toFixed(1), res: res == null ? null : +res.toFixed(1), um, calibrado });
  }
  return rows;
}

function mapReading(reading: SimulatedReading): SensorReading {
  return {
    timestamp: reading.t,
    distanceCm: reading.dist,
    ultrasonicLevelCm: reading.ult,
    resistiveLevelCm: reading.res,
    humidityPct: reading.um,
    calibrated: reading.calibrado,
  };
}

export const TODAS: SensorReading[] = gerar().map(mapReading);
export const AGORA = new Date(BASE.getTime() + 2 * 60000);
export function getReadings(): SensorReading[] {
  return TODAS.map((reading) => ({ ...reading }));
}
