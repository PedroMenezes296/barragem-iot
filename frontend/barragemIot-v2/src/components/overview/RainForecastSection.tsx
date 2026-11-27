import { Skeleton, Typography } from "@mui/material";
import DashboardCard from "@/components/ui/DashboardCard";
import { getForecastData } from "@/services/forecast.service";
import RainForecastChart from "./RainForecastChart";

export function RainForecastLoading() {
  return (
    <DashboardCard>
      <Typography variant="h6">Previsão de chuva</Typography>
      <Typography variant="body2">Consultando previsão…</Typography>
      <Skeleton variant="rounded" height={250} sx={{ mt: 2 }} />
    </DashboardCard>
  );
}

export default async function RainForecastSection() {
  return <RainForecastChart forecast={await getForecastData()} />;
}
