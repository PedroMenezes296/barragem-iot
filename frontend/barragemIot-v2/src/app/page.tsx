import OverviewDashboard from "@/components/overview/OverviewDashboard";
import { dashboardService } from "@/services/dashboard.service";
import { getReadingData } from "@/services/readings.service";
export default async function HomePage() {
  const data = await getReadingData();
  return (
    <OverviewDashboard
      {...data}
      forecast={dashboardService.getForecast()}
      devices={dashboardService.getDevices()}
      reservoirDemoPct={dashboardService.getReservoirDemoPct()}
    />
  );
}
