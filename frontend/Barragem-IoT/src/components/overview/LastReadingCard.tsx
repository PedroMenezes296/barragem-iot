import Card from "@/components/ui/Card";
import type { SensorReading } from "@/types/leituras";
import { formatDate, formatTime } from "@/utils/formatters";

export default function LastReadingCard({ reading, deviceId }: { reading: SensorReading | null; deviceId: string }) {
  return <Card><h3><span>Última leitura</span></h3><div className="mid">{reading ? <>{formatTime(reading.timestamp)}:00 <small>{formatDate(reading.timestamp)}</small></> : "Sem leitura"}</div><p className="note">{deviceId} · Brasília (UTC−3)</p></Card>;
}
