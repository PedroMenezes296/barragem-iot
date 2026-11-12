'use client';
import { Box, Typography } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import DashboardCard from '@/components/ui/DashboardCard';
import type { ForecastDay } from '@/types/domain';
import { formatDay } from '@/utils/formatters';
export default function RainForecastChart({ forecast }: { forecast: ForecastDay[] }) { return <DashboardCard><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><Box><Typography variant="h6" sx={{ fontWeight: 700 }}>Previsão de chuva</Typography><Typography variant="body2" color="text.secondary">Próximos 7 dias · simulada</Typography></Box><Typography variant="caption" color="text.secondary">mm</Typography></Box><Box sx={{ width: '100%', height: 250, mt: 2 }}><BarChart height={250} hideLegend margin={{ left: 42, right: 12, top: 14, bottom: 42 }} xAxis={[{ scaleType: 'band', data: forecast.map(item => formatDay(item.date)) }]} yAxis={[{ label: 'Precipitação (mm)' }]} series={[{ data: forecast.map(item => item.precipitationMm), label: 'Chuva prevista', color: '#7199C3', valueFormatter: value => value === null ? '—' : `${value} mm` }]} sx={{ '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: '#31445A' }, '& .MuiChartsAxis-tickLabel': { fill: '#91A4BA !important' }, '& .MuiChartsGrid-line': { stroke: 'rgba(145,164,186,.12)' } }} /></Box></DashboardCard>; }
