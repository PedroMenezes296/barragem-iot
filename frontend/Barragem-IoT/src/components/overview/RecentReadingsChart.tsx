import ChartCard from "@/components/charts/ChartCard";
import { SERIES_NIVEL } from "@/data/chartSeries";
import type { SensorReading } from "@/types/leituras";

export default function RecentReadingsChart({ readings }: { readings: SensorReading[] }) {
  return <ChartCard title="Últimas leituras" unit="Nível · cm" rows={readings} series={SERIES_NIVEL} color="var(--chart-ultrasonic)" noteExtra="13:00–14:30 · Intervalos sem leitura aparecem como lacunas." />;
}
