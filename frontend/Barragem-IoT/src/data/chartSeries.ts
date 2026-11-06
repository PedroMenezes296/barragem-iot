import type { ChartSeries } from "../types/leituras";

export const SERIES_NIVEL: ChartSeries[] = [
  {
    key: "ultrasonicLevelCm",
    label: "Ultrassônico",
    unit: "cm",
    color: "var(--chart-ultrasonic)",
  },
  {
    key: "resistiveLevelCm",
    label: "Resistivo",
    unit: "cm",
    color: "var(--chart-resistive)",
    dash: "6 4",
  },
];

export const SERIES_UMIDADE: ChartSeries[] = [
  {
    key: "humidityPct",
    label: "Umidade do ar",
    unit: "%",
    color: "var(--chart-humidity)",
  },
];
