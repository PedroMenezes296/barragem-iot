import DeviceSelector from "@/components/ui/DeviceSelector";
import Card from "@/components/ui/Card";
import type { HistoryPeriod } from "@/types/leituras";

interface HistoryFiltersProps {
  period: HistoryPeriod;
  onPeriodChange: (period: HistoryPeriod) => void;
  interval: string;
  deviceId: string;
  onDeviceChange: (deviceId: string) => void;
}

export default function HistoryFilters({ period, onPeriodChange, interval, deviceId, onDeviceChange }: HistoryFiltersProps) {
  const periods: HistoryPeriod[] = ["6 h", "24 h", "7 dias"];
  return <Card className="filters"><div><label>Período</label><div className="seg">{periods.map((item) => <button key={item} aria-pressed={period === item} onClick={() => onPeriodChange(item)}>{item}</button>)}<button disabled title="Disponível quando a API real estiver ativa">Personalizado</button></div></div><div><label>Intervalo exibido</label><div className="filter-value">{interval}</div></div><div><label>Dispositivo</label><DeviceSelector ariaLabel="Dispositivo do histórico" value={deviceId} onChange={onDeviceChange} /></div></Card>;
}
