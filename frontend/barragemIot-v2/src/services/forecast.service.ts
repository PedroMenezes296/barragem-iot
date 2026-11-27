import "server-only";
import { connection } from "next/server";
import { meteorologiaControllerGetForecast } from "@/generated/api/meteorologia/meteorologia";
import { usesSimulatedReadings } from "@/lib/api-config";
import { dashboardService } from "./dashboard.service";
import { toForecast } from "./forecast-adapter";
import type { ForecastData } from "@/types/domain";

export async function getForecastData(): Promise<ForecastData> {
  await connection();
  if (usesSimulatedReadings())
    return {
      source: "mock",
      days: dashboardService.getForecast(),
      location: "Demonstração",
      timezone: "America/Sao_Paulo",
      fetchedAt: null,
      error: null,
    };
  const empty: ForecastData = {
    source: "api",
    days: [],
    location: "",
    timezone: "America/Sao_Paulo",
    fetchedAt: null,
    error:
      "Previsão temporariamente indisponível. Nova tentativa automática em até um minuto.",
  };
  try {
    const response = await meteorologiaControllerGetForecast({
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (response.status !== 200) {
      const body = response.data as unknown as
        { message?: unknown } | undefined;
      if (
        body?.message ===
        "Localização do reservatório ainda não configurada para a previsão."
      )
        return { ...empty, error: body.message };
      return empty;
    }
    return toForecast(response.data);
  } catch {
    return empty;
  }
}
