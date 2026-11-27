export interface Reading {
  readingId?: string;
  id: string;
  deviceId: string;
  // Em modo API, a linha do tempo usa o recebimento no servidor.
  timestamp: string;
  rtcTimestamp?: string;
  distanceCm: number | null;
  ultrasonicLevelCm: number | null;
  resistiveLevelCm: number | null;
  humidityPct: number | null;
}
export interface ReadingData {
  source: "api" | "mock";
  readings: Reading[];
  error: string | null;
}
export interface ForecastDay {
  date: string;
  precipitationMm: number | null;
}
export interface ForecastData {
  source: "api" | "mock";
  days: ForecastDay[];
  location: string;
  timezone: string;
  fetchedAt: string | null;
  error: string | null;
}
export type AlertSeverity = "info" | "warning" | "critical";
export interface MonitoringAlert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  generatedAt: string;
  conditions: string[];
}
export interface Device {
  id: string;
  name: string;
  status: "online" | "offline";
  sensors: number;
}
