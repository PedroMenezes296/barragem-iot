import "server-only";
import { connection } from "next/server";
import { leiturasControllerFindAll } from "@/generated/api/leituras/leituras";
import { usesSimulatedReadings } from "@/lib/api-config";
import { dashboardService } from "./dashboard.service";
import { sortReadings, toReading } from "./reading-adapter";
import type { ReadingData } from "@/types/domain";

export async function getReadingData(): Promise<ReadingData> {
  await connection();
  if (usesSimulatedReadings()) {
    return {
      source: "mock",
      readings: dashboardService.getReadings(),
      error: null,
    };
  }
  try {
    const response = await leiturasControllerFindAll({
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
    if (!Array.isArray(response.data))
      throw new Error("Resposta de leituras inválida.");
    return {
      source: "api",
      readings: sortReadings(response.data.map(toReading)),
      error: null,
    };
  } catch (error) {
    console.error(
      "Falha ao consultar leituras:",
      error instanceof Error ? error.message : "Erro desconhecido",
    );
    return {
      source: "api",
      readings: [],
      error:
        "Não foi possível consultar as leituras. Verifique a disponibilidade da API e recarregue a página.",
    };
  }
}
