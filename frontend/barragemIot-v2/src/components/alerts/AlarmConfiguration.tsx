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
        key={config?.atualizadoEm ?? "unconfigured"}
        initialValues={{
          deviceId: config?.idDispositivo ?? "arduino-mega-01",
          reference: config?.distanciaFundoCm?.toString() ?? "5,75",
          full: config?.alturaCheioCm?.toString() ?? "",
          dry: config?.versao === 1 ? "" : (config?.secaPct ?? 20).toString(),
          attention:
            config?.versao === 1 ? "" : (config?.atencaoPct ?? 80).toString(),
          flood:
            config?.versao === 1 ? "" : (config?.inundacaoPct ?? 95).toString(),
          enabled: config?.ativo ?? false,
        }}
        disabled={unavailable}
        legacy={
          config?.versao === 1 &&
          config.secaCm != null &&
          config.atencaoCm != null &&
          config.inundacaoCm != null
            ? {
                secaCm: config.secaCm,
                atencaoCm: config.atencaoCm,
                inundacaoCm: config.inundacaoCm,
              }
            : undefined
        }
        onSave={async (draft) => {
          const input = parseAlarmDraft(draft);
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
                {status?.percentualNivelPct != null &&
                  ` · ${status.percentualNivelPct.toLocaleString("pt-BR")}%`}
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
            O NestJS calcula o nível e avalia as leituras recebidas. Após
            carregar o firmware atualizado, o Arduino também calcula localmente
            e controla o buzzer/relé, mesmo sem conexão, usando os últimos
            limites salvos na EEPROM. Ele consulta a configuração a cada 10
            segundos quando houver conexão. O estado acima não confirma o
            acionamento físico.
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
