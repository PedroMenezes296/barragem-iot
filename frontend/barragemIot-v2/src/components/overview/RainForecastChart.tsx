"use client";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Link, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import DashboardCard from "@/components/ui/DashboardCard";
import type { ForecastData } from "@/types/domain";

function dayLabel(day: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}

export default function RainForecastChart({
  forecast,
}: {
  forecast: ForecastData;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const simulated = forecast.source === "mock";
  useEffect(() => {
    if (simulated) return;
    const refresh = () => {
      if (document.visibilityState === "visible")
        startTransition(() => router.refresh());
    };
    const timer = setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, simulated]);
  return (
    <DashboardCard>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Previsão de chuva
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {simulated
              ? "Próximos 7 dias · simulada"
              : "Hoje e próximos 6 dias · Open-Meteo"}
          </Typography>
          {forecast.location && (
            <Typography variant="caption" color="text.secondary">
              {forecast.location}
            </Typography>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          mm
        </Typography>
      </Box>
      {forecast.error ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {forecast.error}
        </Alert>
      ) : (
        <>
          <Box sx={{ width: "100%", height: 250, mt: 2 }}>
            <BarChart
              height={250}
              hideLegend
              margin={{ left: 42, right: 12, top: 14, bottom: 42 }}
              xAxis={[
                {
                  scaleType: "band",
                  data: forecast.days.map((item) => item.date),
                  valueFormatter: dayLabel,
                },
              ]}
              yAxis={[{ label: "Precipitação (mm)", min: 0 }]}
              series={[
                {
                  data: forecast.days.map((item) => item.precipitationMm),
                  label: "Precipitação prevista",
                  color: "#7199C3",
                  valueFormatter: (value) =>
                    value === null
                      ? "Sem previsão disponível"
                      : `${value.toLocaleString("pt-BR")} mm`,
                },
              ]}
              sx={{
                "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                  stroke: "#31445A",
                },
                "& .MuiChartsAxis-tickLabel": { fill: "#91A4BA !important" },
                "& .MuiChartsGrid-line": { stroke: "rgba(145,164,186,.12)" },
              }}
            />
          </Box>
          {forecast.days.some((day) => day.precipitationMm === null) && (
            <Typography variant="caption" color="text.secondary">
              Dias sem previsão disponível aparecem sem barra; isso não
              significa ausência de chuva.
            </Typography>
          )}
          {!simulated && forecast.fetchedAt && (
            <Typography variant="caption" color="text.secondary" component="p">
              Consultada em{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: forecast.timezone,
              }).format(new Date(forecast.fetchedAt))}{" "}
              · {forecast.timezone}. Atualização automática a cada 15 minutos.
            </Typography>
          )}
        </>
      )}
      {!simulated && (
        <Typography
          variant="caption"
          color="text.secondary"
          component="p"
          sx={{ mt: 1 }}
        >
          Fonte:{" "}
          <Link href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </Link>{" "}
          · precipitação total prevista em milímetros.
        </Typography>
      )}
    </DashboardCard>
  );
}
