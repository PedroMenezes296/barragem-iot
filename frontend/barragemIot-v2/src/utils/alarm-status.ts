import type { AlarmStatusDto } from "@/generated/api/models";

export function currentAlarmStatus(
  status: AlarmStatusDto | null,
  now: number,
): AlarmStatusDto | null {
  if (
    !status ||
    !status.recebidoEm ||
    status.estado === "desativado" ||
    now === 0
  )
    return status;
  const age = now - Date.parse(status.recebidoEm);
  if (!Number.isFinite(age) || age > 30_000 || age < -5000)
    return {
      ...status,
      estado: "desatualizado",
      alarmeAtivo: false,
      nivelCm: null,
      percentualNivelPct: null,
    };
  return status;
}

export const ALARM_LABELS = {
  desativado: "Alarmes desativados",
  sem_dados: "Sem nível válido",
  desatualizado: "Leitura desatualizada",
  normal: "Nível dentro dos limites",
  seca: "Alerta de seca",
  atencao: "Atenção: nível elevado",
  inundacao: "Alerta de inundação",
} as const;
