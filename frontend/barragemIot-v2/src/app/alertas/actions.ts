"use server";
import { alertasControllerUpdate } from "@/generated/api/alertas/alertas";
import type { UpdateAlarmConfigDto } from "@/generated/api/models";
import { usesSimulatedReadings } from "@/lib/api-config";

export async function saveAlarmLimits(
  input: UpdateAlarmConfigDto,
): Promise<{ ok: boolean; message?: string }> {
  if (usesSimulatedReadings())
    return {
      ok: false,
      message: "Configuração indisponível no modo demonstração.",
    };
  try {
    const response = await alertasControllerUpdate(input, {
      signal: AbortSignal.timeout(5000),
    });
    if (response.status !== 200)
      return {
        ok: false,
        message:
          "Os limites não foram salvos. Verifique os valores e a disponibilidade da API.",
      };
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Não foi possível salvar os limites. Tente novamente.",
    };
  }
}
