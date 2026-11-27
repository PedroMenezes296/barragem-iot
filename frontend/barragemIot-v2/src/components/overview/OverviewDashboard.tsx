import { Alert, Box, Chip, Stack, Typography } from "@mui/material";
import WaterDropOutlined from "@mui/icons-material/WaterDropOutlined";
import SensorsRounded from "@mui/icons-material/SensorsRounded";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import OpacityRounded from "@mui/icons-material/OpacityRounded";
import ReservoirCapacityCard from "./ReservoirCapacityCard";
import WaterLevelChart from "./WaterLevelChart";
import { Suspense } from "react";
import RainForecastSection, {
  RainForecastLoading,
} from "./RainForecastSection";
import MetricCard from "./MetricCard";
import type { ReadingData, Device } from "@/types/domain";
import { formatDateTime, formatValue } from "@/utils/formatters";
interface Props extends ReadingData {
  devices: Device[];
  reservoirDemoPct: number;
}
export default function OverviewDashboard({
  readings,
  source,
  error,
  devices,
  reservoirDemoPct,
}: Props) {
  const latest = readings[0];
  const mock = source === "mock";
  const sensorCount = [
    latest?.ultrasonicLevelCm ?? null,
    latest?.resistiveLevelCm ?? null,
    latest?.humidityPct ?? null,
  ].filter((x) => x !== null).length;
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Visão geral</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.7 }}>
          Acompanhe as condições do reservatório experimental.
        </Typography>
      </Box>
      <Alert
        severity={error ? "error" : "info"}
        variant="outlined"
        sx={{ borderRadius: 3 }}
      >
        {error ??
          (mock
            ? "Painel em modo de demonstra\u00e7\u00e3o. Leituras, previs\u00f5es e indicadores s\u00e3o simulados e n\u00e3o representam uma avalia\u00e7\u00e3o de seguran\u00e7a."
            : "Leituras e nível consultados na API. Previsão meteorológica via Open-Meteo. A lista de eventos permanece demonstrativa.")}
      </Alert>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(280px, .85fr) minmax(0, 1.65fr)",
          },
          gap: 2.5,
        }}
      >
        <ReservoirCapacityCard value={reservoirDemoPct} />
        <WaterLevelChart readings={readings} simulated={mock} />
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 2.5,
        }}
      >
        <Suspense fallback={<RainForecastLoading />}>
          <RainForecastSection />
        </Suspense>
        <Stack spacing={2.5}>
          <MetricCard
            label="Umidade relativa"
            value={formatValue(latest?.humidityPct ?? null, "%")}
            detail={
              mock
                ? "Sensor ambiental \u00b7 simulada"
                : "Sensor ambiental \u00b7 API"
            }
            icon={<OpacityRounded />}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <MetricCard
              label="Nível atual"
              value={formatValue(latest?.ultrasonicLevelCm ?? null, " cm")}
              detail="Ultrassônico calculado"
              icon={<WaterDropOutlined />}
            />
            <MetricCard
              label={mock ? "Sensores ativos" : "Sensores com dados"}
              value={`${sensorCount}/3`}
              detail={
                mock
                  ? `${devices.length} dispositivo online`
                  : `${new Set(readings.map((reading) => reading.deviceId)).size} dispositivo(s) nas leituras`
              }
              icon={<SensorsRounded />}
            />
          </Box>
          <MetricCard
            label="Última leitura"
            value={latest ? formatDateTime(latest.timestamp) : "\u2014"}
            detail={
              <>
                <Chip
                  size="small"
                  label={
                    mock
                      ? "Sistema online"
                      : latest
                        ? "Leitura registrada"
                        : "Sem leituras"
                  }
                  color={mock ? "success" : "default"}
                  sx={{ height: 21, mr: 0.7 }}
                />
                {mock
                  ? "Atualiza\u00e7\u00e3o simulada"
                  : "Conex\u00e3o do dispositivo n\u00e3o verificada"}
              </>
            }
            icon={<AccessTimeRounded />}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
