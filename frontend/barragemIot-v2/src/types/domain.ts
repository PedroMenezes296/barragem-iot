export interface Reading {
  readingId?: string;
  id: string;
  deviceId: string;
  timestamp: string;
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
  precipitationMm: number;
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
