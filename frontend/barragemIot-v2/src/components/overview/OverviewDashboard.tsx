import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import WaterDropOutlined from '@mui/icons-material/WaterDropOutlined';
import SensorsRounded from '@mui/icons-material/SensorsRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import OpacityRounded from '@mui/icons-material/OpacityRounded';
import ReservoirCapacityCard from './ReservoirCapacityCard';
import WaterLevelChart from './WaterLevelChart';
import RainForecastChart from './RainForecastChart';
import MetricCard from './MetricCard';
import { dashboardService } from '@/services/dashboard.service';
import { formatDateTime, formatValue } from '@/utils/formatters';
export default function OverviewDashboard() {
  const readings = dashboardService.getReadings(); const latest = readings[0]; const devices = dashboardService.getDevices();
  const sensorCount = [latest.ultrasonicLevelCm, latest.resistiveLevelCm, latest.humidityPct].filter(x => x !== null).length;
  return <Stack spacing={3}><Box><Typography variant="h4">Visão geral</Typography><Typography color="text.secondary" sx={{ mt: .7 }}>Acompanhe as condições do reservatório experimental.</Typography></Box><Alert severity="info" variant="outlined" sx={{ borderRadius: 3 }}>Painel em modo de demonstração. Leituras, previsões e indicadores são simulados e não representam uma avaliação de segurança.</Alert><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(280px, .85fr) minmax(0, 1.65fr)' }, gap: 2.5 }}><ReservoirCapacityCard value={dashboardService.getReservoirDemoPct()} /><WaterLevelChart readings={readings} /></Box><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}><RainForecastChart forecast={dashboardService.getForecast()} /><Stack spacing={2.5}><MetricCard label="Umidade relativa" value={formatValue(latest.humidityPct, '%')} detail="Sensor ambiental · simulada" icon={<OpacityRounded />} /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr' }, gap: 2.5 }}><MetricCard label="Nível atual" value={formatValue(latest.ultrasonicLevelCm, ' cm')} detail="Ultrassônico calculado" icon={<WaterDropOutlined />} /><MetricCard label="Sensores ativos" value={`${sensorCount}/3`} detail={`${devices.length} dispositivo online`} icon={<SensorsRounded />} /></Box><MetricCard label="Última leitura" value={formatDateTime(latest.timestamp)} detail={<><Chip size="small" label="Sistema online" color="success" sx={{ height: 21, mr: .7 }} />Atualização simulada</>} icon={<AccessTimeRounded />} /></Stack></Box></Stack>;
}
