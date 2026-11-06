import Card from "@/components/ui/Card";

export default function HumidityCard({ value }: { value: number | null | undefined }) {
  return <Card><h3><span>Umidade do ar</span></h3><div className="big" style={{ color: "var(--chart-humidity)" }}>{value ?? "—"}<small>%</small></div><p className="note">Condição do ar junto ao reservatório. Sensor ambiental DHT.</p></Card>;
}
