import ChartCard from "@/components/charts/ChartCard";
import { SERIES_NIVEL } from "@/data/chartSeries";
import type { SensorReading } from "@/types/leituras";

export default function LevelHistoryChart({ readings }: { readings: SensorReading[] }) {
  return <ChartCard title="Nível da água" unit="cm" rows={readings} series={SERIES_NIVEL} color="var(--chart-ultrasonic)" noteExtra="Sem leitura: quebra nas duas séries. Resistivo não calibrado: sem ponto no gráfico, nunca zero." />;
}
