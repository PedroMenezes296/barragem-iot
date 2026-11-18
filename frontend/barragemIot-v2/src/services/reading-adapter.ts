import type { LeituraResponseDto } from "@/generated/api/models";
import type { Reading } from "@/types/domain";

export function toReading(dto: LeituraResponseDto): Reading {
  if (!Number.isFinite(Date.parse(dto.timestampRtc))) {
    throw new Error("Horário de leitura inválido retornado pela API.");
  }
  return {
    id: dto.id,
    readingId: dto.idLeitura,
    deviceId: dto.idDispositivo,
    timestamp: dto.timestampRtc,
    distanceCm: dto.distanciaCm,
    ultrasonicLevelCm: dto.nivelUltrassonicoCm,
    resistiveLevelCm: dto.nivelResistivoCm,
    humidityPct: dto.umidadePct,
  };
}

export function sortReadings(readings: Reading[]): Reading[] {
  return [...readings].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  );
}
