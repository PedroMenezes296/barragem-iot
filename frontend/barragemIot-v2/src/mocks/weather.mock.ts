import type { ForecastDay } from '@/types/domain';
export const forecast: ForecastDay[] = [12, 28, 35, 19, 13, 9, 6].map((precipitationMm, i) => {
  const date = new Date('2026-11-10T12:00:00'); date.setDate(date.getDate() + i);
  return { date: date.toISOString(), precipitationMm };
});
