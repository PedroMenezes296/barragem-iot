export interface SensorReading {
  timestamp: Date;
  distanceCm: number | null;
  ultrasonicLevelCm: number | null;
  resistiveLevelCm: number | null;
  humidityPct: number | null;
  calibrated: boolean;
}

export interface LeituraApi {
  id: string;
  versao: number;
  idDispositivo: string;
  idLeitura: string;
  timestampRtc: string;
  distanciaCm?: number | null;
  nivelUltrassonicoCm?: number | null;
  nivelResistivoCm?: number | null;
  umidadePct?: number | null;
  recebidoEm: string;
}

export type ReadingMetric = Exclude<keyof SensorReading, "timestamp" | "calibrated">;

export interface ChartSeries {
  key: ReadingMetric;
  label: string;
  unit: string;
  color?: string;
  dash?: string;
}

export type HistoryPeriod = "6 h" | "24 h" | "7 dias";

export interface HistoryFiltersState {
  period: HistoryPeriod;
  deviceId: string;
}

export interface ActiveAlert {
  id: string;
  message: string;
}
