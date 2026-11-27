import type { AlarmConfigDto } from './alertas.dto.js';
import {
  MAX_SENSOR_DISTANCE_CM,
  MIN_SENSOR_DISTANCE_CM,
} from './alertas.dto.js';

export function maximumLevel(reference: number): number {
  return Number((reference - MIN_SENSOR_DISTANCE_CM).toFixed(2));
}

// Percentual da altura, não do volume; referência de cheio independente dos alarmes.
export function calculatePercentage(
  level: number | null,
  fullLevel: number | null,
): number | null {
  if (
    level === null ||
    fullLevel === null ||
    !Number.isFinite(level) ||
    !Number.isFinite(fullLevel) ||
    level < 0 ||
    fullLevel <= 0
  )
    return null;
  const levelHundredths = Math.round(level * 100);
  const floodHundredths = Math.round(fullLevel * 100);
  if (floodHundredths <= 0) return null;
  // Mesma aritmética inteira da placa, inclusive nas metades decimais.
  return (
    Math.floor(
      (levelHundredths * 10_000 + floodHundredths / 2) / floodHundredths,
    ) / 100
  );
}

export function calculateLevel(
  deviceId: string,
  distance: number | null | undefined,
  config: AlarmConfigDto,
): number | null {
  const reference = config.distanciaFundoCm;
  if (
    deviceId !== config.idDispositivo ||
    reference === null ||
    !Number.isFinite(reference) ||
    reference <= MIN_SENSOR_DISTANCE_CM ||
    reference > MAX_SENSOR_DISTANCE_CM ||
    distance == null ||
    !Number.isFinite(distance) ||
    distance < MIN_SENSOR_DISTANCE_CM ||
    distance > MAX_SENSOR_DISTANCE_CM ||
    distance > reference
  )
    return null;
  return Number((reference - distance).toFixed(2));
}
