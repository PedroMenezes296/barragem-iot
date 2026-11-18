import type { Reading } from "@/types/domain";
export type HistoryPeriod = "all" | "1" | "7";

export function filterReadings(
  readings: Reading[],
  period: HistoryPeriod,
): Reading[] {
  if (period === "all" || readings.length === 0) return readings;
  const reference = Date.parse(readings[0].timestamp);
  return readings.filter(
    (reading) =>
      reference - Date.parse(reading.timestamp) <= Number(period) * 86400000,
  );
}

export function clampPage(
  page: number,
  total: number,
  pageSize: number,
): number {
  return Math.max(0, Math.min(page, Math.ceil(total / pageSize) - 1));
}
