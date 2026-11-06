import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import type { SensorReading } from "@/types/leituras";
import { formatDate, formatNumber, formatTime } from "@/utils/formatters";
import Pagination from "./Pagination";

interface ReadingsTableProps {
  readings: SensorReading[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  deviceId: string;
  onPageChange: (page: number) => void;
}

export default function ReadingsTable({ readings, total, page, pages, pageSize, deviceId, onPageChange }: ReadingsTableProps) {
  return <Card><h3><span>Leituras registradas</span><span>{total} registros</span></h3><div className="tw"><table><thead><tr><th>Data</th><th>Hora</th><th>Dispositivo</th><th className="n">Distância (cm)</th><th className="n">Nível ultrassônico (cm)</th><th className="n">Nível resistivo (cm)</th><th className="n">Umidade (%)</th></tr></thead><tbody>{readings.length ? readings.map((reading) => <tr key={reading.timestamp.getTime()}><td>{formatDate(reading.timestamp)}</td><td>{formatTime(reading.timestamp)}:00</td><td>{deviceId}</td><td className="n">{formatNumber(reading.distanceCm)}</td><td className="n" style={{ color: "var(--chart-ultrasonic)" }}>{formatNumber(reading.ultrasonicLevelCm)}</td><td className={`n${reading.resistiveLevelCm == null && !reading.calibrated ? " m" : ""}`} style={reading.resistiveLevelCm != null ? { color: "var(--chart-resistive)" } : undefined}>{reading.resistiveLevelCm == null && !reading.calibrated ? "Não calibrado" : formatNumber(reading.resistiveLevelCm)}</td><td className="n">{reading.humidityPct ?? "—"}</td></tr>) : <tr><td colSpan={7}><EmptyState>Sem leituras no período selecionado.</EmptyState></td></tr>}</tbody></table></div><p className="note">— Sem dados · Não calibrado: leitura sem referência válida de nível. Distância sensor → água não equivale ao nível da água.</p><Pagination page={page} pages={pages} total={total} pageSize={pageSize} onPageChange={onPageChange} /></Card>;
}
