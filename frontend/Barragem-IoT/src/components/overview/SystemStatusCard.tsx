import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";

export default function SystemStatusCard({ minutesSinceReading, readingIntervalMinutes = 15 }: { minutesSinceReading: number | null; readingIntervalMinutes?: number }) {
  const fresh = minutesSinceReading != null && minutesSinceReading <= 30;
  const variant = fresh ? "ok" : minutesSinceReading == null ? "off" : "warn";
  const status = fresh ? "Atualizado" : minutesSinceReading == null ? "Sem dados" : "Desatualizado";
  return <Card><h3><span>Estado do sistema</span><StatusBadge variant={variant}>{status}</StatusBadge></h3><div className="mid">{minutesSinceReading == null ? "Sem leitura" : `Última leitura há ${minutesSinceReading} min`}</div><p className="note">Recebimento a cada {readingIntervalMinutes} minutos.</p></Card>;
}
