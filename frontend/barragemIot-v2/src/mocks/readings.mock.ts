import type { Reading } from '@/types/domain';

const base = new Date('2026-11-10T14:30:00-03:00');
export const readings: Reading[] = Array.from({ length: 36 }, (_, i) => {
  const time = new Date(base.getTime() - i * 30 * 60_000);
  return {
    id: `LEIT-${String(1842 - i).padStart(5, '0')}`, deviceId: 'BRG-DEV-001', timestamp: time.toISOString(),
    distanceCm: i === 7 ? null : Number((82 - Math.sin(i / 4) * 4 + i * 0.06).toFixed(1)),
    ultrasonicLevelCm: i === 7 ? null : Number((68 + Math.sin(i / 4) * 3 - i * 0.04).toFixed(1)),
    resistiveLevelCm: i === 12 ? null : Number((67 + Math.sin(i / 4 + 0.4) * 2.7 - i * 0.035).toFixed(1)),
    humidityPct: i === 15 ? null : Math.round(72 - Math.sin(i / 5) * 5),
  };
});
