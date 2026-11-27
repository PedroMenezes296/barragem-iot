import type { ForecastDay } from "@/types/domain";
export function getSimulatedForecast(): ForecastDay[] {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  return [12, 28, 35, 19, 13, 9, 6].map((precipitationMm, i) => ({
    date: new Date(Date.parse(`${today}T00:00:00Z`) + i * 86400000)
      .toISOString()
      .slice(0, 10),
    precipitationMm,
  }));
}
