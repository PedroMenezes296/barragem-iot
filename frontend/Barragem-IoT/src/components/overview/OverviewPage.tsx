import ActiveAlertsCard from "@/components/overview/ActiveAlertsCard";
import DistanceCard from "@/components/overview/DistanceCard";
import HumidityCard from "@/components/overview/HumidityCard";
import LastReadingCard from "@/components/overview/LastReadingCard";
import RecentReadingsChart from "@/components/overview/RecentReadingsChart";
import StateGuideCard from "@/components/overview/StateGuideCard";
import SystemStatusCard from "@/components/overview/SystemStatusCard";
import WaterLevelCard from "@/components/overview/WaterLevelCard";
import { AGORA, getReadings } from "@/data/leituras";

const DEVICE_ID = "arduino-mega-01";

export default function VisaoGeral() {
  const readings = getReadings();
  const latest = readings[0] ?? null;
  const minutesSinceReading = latest ? Math.round((AGORA.getTime() - latest.timestamp.getTime()) / 60000) : null;

  return <>
    <div><h2 className="t">Estado atual do reservatório</h2><p className="lead">Nível da água, umidade e condição do sistema em uma única tela.</p></div>
    <div className="grid two"><SystemStatusCard minutesSinceReading={minutesSinceReading} /><LastReadingCard reading={latest} deviceId={DEVICE_ID} /></div>
    <div className="grid"><DistanceCard value={latest?.distanceCm} /><WaterLevelCard reading={latest} /><HumidityCard value={latest?.humidityPct} /></div>
    <div className="chartrow"><RecentReadingsChart readings={readings.slice(0, 7)} /><ActiveAlertsCard alerts={[]} /></div>
    <StateGuideCard />
  </>;
}
