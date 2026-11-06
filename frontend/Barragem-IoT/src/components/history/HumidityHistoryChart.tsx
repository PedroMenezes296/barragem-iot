import ChartCard from "@/components/charts/ChartCard";
import { SERIES_UMIDADE } from "@/data/chartSeries";
import type { SensorReading } from "@/types/leituras";

export default function HumidityHistoryChart({ readings }: { readings: SensorReading[] }) {
  return <ChartCard title="Umidade do ar" unit="%" rows={readings} series={SERIES_UMIDADE} color="var(--chart-humidity)" noteExtra="Sensor ambiental DHT." />;
}
