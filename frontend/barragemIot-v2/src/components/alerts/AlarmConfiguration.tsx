"use client";
import { useState } from "react";
import { Alert, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useAlarmMonitor } from "@/hooks/useAlarmMonitor";
import { ALARM_LABELS } from "@/utils/alarm-status";
import { parseAlarmDraft } from "@/utils/alarm-form";
import { saveAlarmLimits } from "@/app/alertas/actions";
import AlarmLimitsForm from "./AlarmLimitsForm";
import DashboardCard from "@/components/ui/DashboardCard";

export default function AlarmConfiguration() {
  const monitor = useAlarmMonitor();
  const router = useRouter();
  const [audioError, setAudioError] = useState("");
  if (!monitor) return null;
  const { config, status } = monitor;
  const unavailable = monitor.source === "mock" || !config;
  return (
    <Stack spacing={2.5}>
      {monitor.error && <Alert severity="error">{monitor.error}</Alert>}
      {monitor.source === "mock" && (
        <Alert severity="info">
          Configuração de alarmes reais indisponível no modo demonstração.
        </Alert>
      )}
      <AlarmLimitsForm
        initialValues={{
          deviceId: config?.idDispositivo ?? "arduino-mega-01",
          dry: config?.secaCm?.toString() ?? "",
          attention: config?.atencaoCm?.toString() ?? "",
          flood: config?.inundacaoCm?.toString() ?? "",
          enabled: config?.ativo ?? false,
        }}
        disabled={unavailable}
        onSave={async (draft) => {
          const input = parseAlarmDraft(
            draft,
            config?.nivelMaximoConfiguravelCm ?? 3.75,
          );
          const result = await saveAlarmLimits(input);
          if (!result.ok) throw new Error(result.message);
          router.refresh();
        }}
      />
      <DashboardCard>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h6" component="h2">
                Monitoramento dos alarmes
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Nível ultrassônico:{" "}
                {status?.nivelCm == null
                  ? "—"
                  : `${status.nivelCm.toLocaleString("pt-BR")} cm`}
              </Typography>
            </Box>
            <Chip
              label={
                status ? ALARM_LABELS[status.estado] : "Estado indisponível"
              }
              color={
                status?.alarmeAtivo
                  ? status.estado === "atencao"
                    ? "warning"
                    : "error"
                  : "default"
              }
            />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Os limites salvos são compartilhados com o Arduino. Após carregar o
            firmware atualizado, ele consultará a configuração a cada 10
            segundos para acionar o buzzer/relé. O estado acima representa a
            avaliação das leituras recebidas; não confirma o acionamento físico.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Leituras ausentes, inválidas ou recebidas há mais de 30 segundos não
            geram novos alarmes no dashboard.
          </Typography>
          <Button
            variant="outlined"
            disabled={unavailable}
            onClick={async () => {
              setAudioError("");
              if (monitor.soundEnabled) monitor.disableSound();
              else
                try {
                  await monitor.enableSound();
                } catch (error) {
                  setAudioError(
                    error instanceof Error
                      ? error.message
                      : "Som indisponível.",
                  );
                }
            }}
          >
            {monitor.soundEnabled
              ? "Desativar som neste navegador"
              : "Ativar som neste navegador"}
          </Button>
          {audioError && <Alert severity="warning">{audioError}</Alert>}
        </Stack>
      </DashboardCard>
    </Stack>
  );
}
