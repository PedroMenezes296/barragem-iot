"use client";

import type { Dispatch, PointerEvent, SetStateAction } from "react";
import EmptyState from "@/components/ui/EmptyState";
import type { ChartSeries, SensorReading } from "@/types/leituras";
import { formatDate, formatTime } from "@/utils/formatters";

interface LineChartProps {
  rows: SensorReading[];
  series: ChartSeries[];
  color: string;
  cursor: number | null;
  onCursorChange: Dispatch<SetStateAction<number | null>>;
}

export default function LineChart({ rows, series, color, cursor, onCursorChange }: LineChartProps) {
  const width = 720, height = 240, left = 48, right = 14, top = 12, bottom = 30;
  const values = rows.flatMap((row) => series.map((item) => row[item.key])).filter((value): value is number => value != null);
  const count = rows.length;
  if (count === 0 || values.length === 0) return <EmptyState className="chart-empty">Sem leituras no período selecionado.</EmptyState>;

  const low = Math.floor(Math.min(...values) / 5) * 5 - 5;
  const high = Math.ceil(Math.max(...values) / 5) * 5 + 5;
  const x = (index: number) => left + (index / Math.max(count - 1, 1)) * (width - left - right);
  const y = (value: number) => top + (1 - (value - low) / (high - low)) * (height - top - bottom);
  const ticks = [0, 1, 2, 3, 4].map((step) => low + ((high - low) * step) / 4);
  const xTicks = [...new Set([0, Math.round((count - 1) / 3), Math.round((2 * (count - 1)) / 3), count - 1])];
  const dateLabel = (row: SensorReading) =>
    (rows[count - 1].timestamp.getTime() - rows[0].timestamp.getTime() > 36e5 * 30
      ? `${formatDate(row.timestamp).slice(0, 5)} ` : "") + formatTime(row.timestamp);
  const segments = (key: ChartSeries["key"]) => {
    const result: Array<Array<[number, number]>> = [];
    let current: Array<[number, number]> = [];
    rows.forEach((row, index) => {
      const value = row[key];
      if (value == null) {
        if (current.length) result.push(current);
        current = [];
      } else current.push([x(index), y(value)]);
    });
    if (current.length) result.push(current);
    return result;
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) return;
    const pixel = ((event.clientX - bounds.left) / bounds.width) * width;
    onCursorChange(Math.max(0, Math.min(count - 1, Math.round(((pixel - left) / (width - left - right)) * (count - 1)))));
  };
  const selected = cursor == null ? null : Math.min(cursor, count - 1);

  return (
    <svg className="ch" viewBox={`0 0 ${width} ${height}`} onPointerMove={move} onPointerLeave={() => onCursorChange(null)} role="img" aria-label="Gráfico de leituras">
      {ticks.map((value) => <g key={value}><line className="chart-grid" x1={left} x2={width - right} y1={y(value)} y2={y(value)} /><text x={left - 8} y={y(value) + 4} textAnchor="end">{Math.round(value)}</text></g>)}
      {xTicks.map((index, position) => <text className="chart-axis" key={index} x={x(index)} y={height - 8} textAnchor={position === 0 ? "start" : position === xTicks.length - 1 ? "end" : "middle"}>{dateLabel(rows[index])}</text>)}
      {series.map((item) => segments(item.key).map((segment, index) => segment.length === 1
        ? <circle key={`${item.key}${index}`} cx={segment[0][0]} cy={segment[0][1]} r="3" fill={item.color || color} />
        : <path className="chart-series" key={`${item.key}${index}`} d={`M${segment.map((point) => point.join(" ")).join("L")}`} fill="none" stroke={item.color || color} strokeWidth="2.2" strokeDasharray={item.dash} strokeLinejoin="round" strokeLinecap="round" />))}
      {selected != null && <line className="chart-cursor" x1={x(selected)} x2={x(selected)} y1={top} y2={height - bottom} />}
      {selected != null && series.map((item) => rows[selected][item.key] != null && <circle key={item.key} cx={x(selected)} cy={y(rows[selected][item.key]!)} r="4.5" fill="var(--panel)" stroke={item.color || color} strokeWidth="2" />)}
    </svg>
  );
}
