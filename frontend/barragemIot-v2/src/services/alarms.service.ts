import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { usesSimulatedReadings } from "@/lib/api-config";
import {
  alertasControllerGetConfig,
  alertasControllerGetStatus,
} from "@/generated/api/alertas/alertas";
import type { AlarmPageData } from "@/types/alarms";

export const getAlarmData = cache(async (): Promise<AlarmPageData> => {
  await connection();
  if (usesSimulatedReadings())
    return { config: null, status: null, error: null, source: "mock" };
  const [config, status] = await Promise.allSettled([
    alertasControllerGetConfig({
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }),
    alertasControllerGetStatus({
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }),
  ]);
  const configData =
    config.status === "fulfilled" && config.value.status === 200
      ? config.value.data
      : null;
  const statusData =
    status.status === "fulfilled" && status.value.status === 200
      ? status.value.data
      : null;
  return {
    config: configData,
    status: statusData,
    error:
      configData && statusData
        ? null
        : "Não foi possível consultar a configuração ou o estado dos alarmes.",
    source: "api",
  };
});
