'use client';
import { Box, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import DashboardCard from '@/components/ui/DashboardCard';
import type { Reading } from '@/types/domain';
import { formatDateTime } from '@/utils/formatters';
export default function WaterLevelChart({ readings }: { readings: Reading[] }) {
  const data = [...readings].slice(0, 12).reverse();
  return <DashboardCard><Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 1 }}><Box><Typography variant="h6" sx={{ fontWeight: 700 }}>Nível de água ao longo do tempo</Typography><Typography variant="body2" color="text.secondary">Comparativo dos sensores · valores simulados</Typography></Box><Typography variant="caption" color="text.secondary">Centímetros (cm)</Typography></Box>
    <Box sx={{ width: '100%', height: 280, mt: 2 }}><LineChart height={280} margin={{ left: 46, right: 18, top: 20, bottom: 42 }} xAxis={[{ scaleType: 'point', data: data.map(x => x.timestamp), valueFormatter: (v) => formatDateTime(v).split(', ')[1] ?? '' }]} yAxis={[{ label: 'Nível (cm)' }]} series={[{ id: 'ultrasonic', label: 'Sensor ultrassônico · nível demonstrativo', data: data.map(x => x.ultrasonicLevelCm), connectNulls: false, color: '#7FA6D1', showMark: false }, { id: 'resistive', label: 'Sensor resistivo', data: data.map(x => x.resistiveLevelCm), connectNulls: false, color: '#50B7AA', showMark: false }]} slotProps={{ legend: { position: { vertical: 'bottom', horizontal: 'center' } } }} sx={{ '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: '#31445A' }, '& .MuiChartsAxis-tickLabel, & .MuiChartsLegend-series text': { fill: '#91A4BA !important' }, '& .MuiChartsGrid-line': { stroke: 'rgba(145,164,186,.12)' } }} /></Box>
  </DashboardCard>;
}
