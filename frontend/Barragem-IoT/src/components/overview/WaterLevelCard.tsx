import Card from "@/components/ui/Card";
import type { SensorReading } from "@/types/leituras";
import { formatNumber } from "@/utils/formatters";

export default function WaterLevelCard({ reading }: { reading: SensorReading | null }) {
  const ultrasonic = reading?.ultrasonicLevelCm;
  const resistive = reading?.resistiveLevelCm;
  return <Card><h3><span>Nível da água</span></h3><div className="row"><span className="big" style={{ color: "var(--chart-ultrasonic)" }}>{formatNumber(ultrasonic)}<small>cm</small></span><span className="lab">Ultrassônico</span></div><div className="row" style={{ marginTop: 6 }}><span className="mid">{resistive == null && reading && !reading.calibrated ? "Não calibrado" : <>{formatNumber(resistive)}<small>cm</small></>}</span><span className="lab">Resistivo</span></div><p className="note">Referência calibrada: fundo do reservatório.</p></Card>;
}
