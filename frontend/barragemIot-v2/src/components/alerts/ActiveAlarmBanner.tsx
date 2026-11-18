"use client";
import { Alert, Button } from "@mui/material";
import { useAlarmMonitor } from "@/hooks/useAlarmMonitor";
import { ALARM_LABELS } from "@/utils/alarm-status";

export default function ActiveAlarmBanner() {
  const monitor = useAlarmMonitor();
  if (!monitor?.status?.alarmeAtivo) return null;
  return (
    <Alert
      severity={monitor.status.estado === "atencao" ? "warning" : "error"}
      role="alert"
      sx={{ mb: 3 }}
      action={
        monitor.soundEnabled ? (
          <Button color="inherit" size="small" onClick={monitor.disableSound}>
            Silenciar som
          </Button>
        ) : undefined
      }
    >
      {ALARM_LABELS[monitor.status.estado]} — nível de água:{" "}
      {monitor.status.nivelCm?.toLocaleString("pt-BR")} cm ·{" "}
      {monitor.config?.idDispositivo}
    </Alert>
  );
}
