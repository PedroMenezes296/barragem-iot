"use client";

import { useMemo, useState } from "react";
import HistoryFilters from "@/components/history/HistoryFilters";
import HumidityHistoryChart from "@/components/history/HumidityHistoryChart";
import LevelHistoryChart from "@/components/history/LevelHistoryChart";
import ReadingsTable from "@/components/history/ReadingsTable";
import { getReadings } from "@/data/leituras";
import { formatDate, formatTime } from "@/utils/formatters";
import type { HistoryPeriod } from "@/types/leituras";

const PERIOD_LIMITS: Record<HistoryPeriod, number> = { "6 h": 24, "24 h": 96, "7 dias": 96 * 7 };
const PAGE_SIZE = 8;
const DEVICE_ID = "arduino-mega-01";

export default function Historico() {
  const [period, setPeriod] = useState<HistoryPeriod>("6 h");
  const [page, setPage] = useState(1);
  const [deviceId, setDeviceId] = useState(DEVICE_ID);
  const allReadings = useMemo(() => getReadings(), []);
  const readings = allReadings.slice(0, PERIOD_LIMITS[period]);
  const pages = Math.ceil(readings.length / PAGE_SIZE);
  const safePage = Math.max(1, Math.min(page, pages || 1));
  const visibleReadings = readings.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const oldest = readings.at(-1);
  const newest = readings[0];
  const interval = oldest && newest ? `${formatDate(oldest.timestamp)} · ${formatTime(oldest.timestamp)}–${formatTime(newest.timestamp)}` : "Sem leituras no período";

  const changePeriod = (nextPeriod: HistoryPeriod) => { setPeriod(nextPeriod); setPage(1); };

  return <>
    <div><h2 className="t">Histórico de leituras</h2><p className="lead">Evolução do nível e da umidade ao longo do tempo.</p></div>
    <HistoryFilters period={period} onPeriodChange={changePeriod} interval={interval} deviceId={deviceId} onDeviceChange={setDeviceId} />
    <LevelHistoryChart readings={readings} />
    <HumidityHistoryChart readings={readings} />
    <ReadingsTable readings={visibleReadings} total={readings.length} page={safePage} pages={pages} pageSize={PAGE_SIZE} deviceId={deviceId} onPageChange={setPage} />
  </>;
}
