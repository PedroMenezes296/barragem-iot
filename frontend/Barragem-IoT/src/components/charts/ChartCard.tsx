"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import type { ChartSeries, SensorReading } from "@/types/leituras";
import { formatDate, formatNumber, formatTime } from "@/utils/formatters";
import LineChart from "./LineChart";

export interface ChartCardProps {
  title: string;
  unit: string;
  rows: SensorReading[];
  series: ChartSeries[];
  color: string;
  noteExtra?: string;
}

export default function ChartCard({ title, unit, rows, series, color, noteExtra }: ChartCardProps) {
  const [cursor, setCursor] = useState<number | null>(null);
  const ascending = useMemo(() => [...rows].reverse(), [rows]);
  const selectedIndex = Math.min(cursor ?? ascending.length - 1, ascending.length - 1);
  const reading = selectedIndex >= 0 ? ascending[selectedIndex] : null;
  return (
    <Card className="chart-card">
      <h3><span>{title}</span><span>{unit}</span></h3>
      <div className="leg">{series.map((item) => <span key={item.key}><i className={item.dash ? "d" : ""} style={{ borderTopColor: item.color || color }} />{item.label}</span>)}</div>
      <LineChart rows={ascending} series={series} color={color} cursor={cursor} onCursorChange={setCursor} />
      {reading && <div className="readout" aria-live="polite"><span>{formatDate(reading.timestamp)} <b>{formatTime(reading.timestamp)}</b></span>{series.map((item) => <span key={item.key}>{item.label}: <b style={{ color: item.color || color }}>{reading[item.key] == null ? (item.key === "resistiveLevelCm" && !reading.calibrated ? "Não calibrado" : "Sem leitura") : `${formatNumber(reading[item.key])} ${item.unit}`}</b></span>)}</div>}
      {noteExtra && <p className="note">{noteExtra}</p>}
    </Card>
  );
}
