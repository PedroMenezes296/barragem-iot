"use client";
import { Box, Typography } from "@mui/material";
import { Gauge } from "@mui/x-charts/Gauge";
import WaterDropRounded from "@mui/icons-material/WaterDropRounded";
import DashboardCard from "@/components/ui/DashboardCard";
import { useAlarmMonitor } from "@/hooks/useAlarmMonitor";

export default function ReservoirCapacityCard({
  value: demoValue,
}: {
  value: number;
}) {
  const monitor = useAlarmMonitor();
  const simulated = monitor?.source === "mock";
  const value = simulated
    ? demoValue
    : (monitor?.status?.percentualNivelPct ?? null);
  const unavailable = monitor?.error
    ? "Não foi possível consultar o nível."
    : monitor?.config?.alturaCheioCm == null
      ? "Configure a altura de 100% na página Alertas."
      : monitor?.status?.estado === "desatualizado"
        ? "Leitura desatualizada. Aguardando novos dados."
        : "Aguardando uma leitura válida do dispositivo configurado.";
  return (
    <DashboardCard>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {simulated ? "NÍVEL DEMONSTRATIVO" : "NÍVEL DO RESERVATÓRIO"}
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.5 }}>
            Reservatório
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Percentual da altura da água, sem conversão para volume.
          </Typography>
        </Box>
        <WaterDropRounded color="primary" />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <Box sx={{ position: "relative", width: 208, height: 190 }}>
          <Gauge
            value={value === null ? null : Math.min(100, Math.max(0, value))}
            text={() => ""}
            startAngle={-110}
            endAngle={110}
            innerRadius="78%"
            outerRadius="100%"
            sx={{
              width: "100%",
              height: "100%",
              "& .MuiGauge-valueArc": { fill: "#5B8DEF" },
              "& .MuiGauge-referenceArc": { fill: "#263B54" },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              pt: 2,
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 750 }}>
              {value === null ? "—" : `${value.toLocaleString("pt-BR")}%`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {simulated ? "nível simulado" : "altura calibrada"}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {simulated
          ? "Valor mockado para demonstração do painel"
          : value === null
            ? unavailable
            : `Dispositivo: ${monitor?.status?.idDispositivo}`}
      </Typography>
    </DashboardCard>
  );
}
