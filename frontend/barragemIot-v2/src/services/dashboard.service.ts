import { readings } from "@/mocks/readings.mock";
import { getSimulatedForecast } from "@/mocks/weather.mock";
import { alerts } from "@/mocks/alerts.mock";
import { devices } from "@/mocks/devices.mock";
export const dashboardService = {
  getReadings: () =>
    [...readings].sort(
      (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
    ),
  getForecast: getSimulatedForecast,
  getAlerts: () => alerts,
  getDevices: () => devices,
  getReservoirDemoPct: () => 68,
};
