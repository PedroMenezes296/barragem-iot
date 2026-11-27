"use client";

import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import DashboardCard from "@/components/ui/DashboardCard";
import { convertLegacyLimits } from "@/utils/alarm-form";

export interface AlarmLimitsDraft {
  deviceId: string;
  reference: string;
  full: string;
  dry: string;
  attention: string;
  flood: string;
  enabled: boolean;
}

interface Props {
  initialValues: AlarmLimitsDraft;
  onSave: (values: AlarmLimitsDraft) => Promise<void>;
  disabled?: boolean;
  legacy?: { secaCm: number; atencaoCm: number; inundacaoCm: number };
}

export default function AlarmLimitsForm({
  initialValues,
  onSave,
  disabled,
  legacy,
}: Props) {
  const [draft, setDraft] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const reference = Number(draft.reference.trim().replace(",", "."));
  const maximum =
    Number.isFinite(reference) && reference > 2 && reference <= 400
      ? Number((reference - 2).toFixed(2))
      : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await onSave(draft);
      setSaved(true);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar os limites.",
      );
    } finally {
      setSaving(false);
    }
  }

  const change = (
    field: "reference" | "full" | "dry" | "attention" | "flood",
    value: string,
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaved(false);
    setError("");
  };

  return (
    <DashboardCard>
      <Box component="form" onSubmit={submit}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6" component="h2">
              Limites dos alarmes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Calibre a altura de 100% e configure os alarmes por porcentagem da
              altura da água.
            </Typography>
          </Box>
          {legacy && (
            <Alert severity="info">
              Configuração antiga em centímetros: seca{" "}
              {legacy.secaCm.toLocaleString("pt-BR")} cm, atenção{" "}
              {legacy.atencaoCm.toLocaleString("pt-BR")} cm e inundação{" "}
              {legacy.inundacaoCm.toLocaleString("pt-BR")} cm. Ela continua
              válida até salvar a conversão. Informe a altura de 100% e converta
              para revisar os percentuais.
            </Alert>
          )}
          <TextField
            label="Dispositivo monitorado"
            value={draft.deviceId}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                deviceId: event.target.value,
              }));
              setSaved(false);
            }}
            required
            disabled={disabled || saving}
            helperText="Os limites se aplicam apenas a este dispositivo."
          />
          <TextField
            label="Distância do sensor ao fundo — reservatório vazio (cm)"
            value={draft.reference}
            onChange={(event) => change("reference", event.target.value)}
            slotProps={{ htmlInput: { inputMode: "decimal" } }}
            required
            disabled={disabled || saving}
            helperText="Referência aplicada somente após salvar. Alterações valem para novas leituras."
          />
          <TextField
            label="Altura da água em 100% (cm)"
            value={draft.full}
            onChange={(event) => change("full", event.target.value)}
            slotProps={{ htmlInput: { inputMode: "decimal" } }}
            required
            disabled={disabled || saving}
            helperText="Altura medida desde o fundo quando o reservatório está cheio. Independente do limite de inundação."
          />
          {legacy && (
            <Button
              variant="outlined"
              disabled={disabled || saving}
              onClick={() => {
                try {
                  const converted = convertLegacyLimits(draft.full, legacy);
                  setDraft((current) => ({ ...current, ...converted }));
                  setError("");
                  setSaved(false);
                } catch (reason) {
                  setError(
                    reason instanceof Error
                      ? reason.message
                      : "Não foi possível converter.",
                  );
                }
              }}
            >
              Converter limites antigos para %
            </Button>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <TextField
              label="Limite de seca (%)"
              value={draft.dry}
              onChange={(event) => change("dry", event.target.value)}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
              required
              disabled={disabled || saving}
              helperText="De 0% até este limite, inclusive."
            />
            <TextField
              label="Limite de atenção (%)"
              value={draft.attention}
              onChange={(event) => change("attention", event.target.value)}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
              required
              disabled={disabled || saving}
              helperText="Deste limite até abaixo da inundação."
            />
            <TextField
              label="Limite de inundação (%)"
              value={draft.flood}
              onChange={(event) => change("flood", event.target.value)}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
              required
              disabled={disabled || saving}
              helperText="Deste limite para cima, inclusive acima de 100%."
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            0% ≤ seca &lt; atenção &lt; inundação ≤ 100%. Entre seca e atenção:
            normal. Distância mínima do sensor: 2 cm.
            {maximum === null
              ? " Informe uma referência maior que 2 e até 400 cm."
              : ` Nível máximo mensurável: ${maximum.toLocaleString("pt-BR")} cm.`}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              justifyContent: "space-between",
              alignItems: { sm: "center" },
            }}
            spacing={2}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={draft.enabled}
                  onChange={(event) => {
                    setDraft((current) => ({
                      ...current,
                      enabled: event.target.checked,
                    }));
                    setSaved(false);
                  }}
                  disabled={disabled || saving}
                />
              }
              label="Ativar alarmes por nível"
            />
            <Button
              variant="contained"
              type="submit"
              disabled={disabled || saving}
            >
              {saving ? "Salvando…" : "Salvar limites"}
            </Button>
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
          {saved && <Alert severity="success">Limites salvos.</Alert>}
        </Stack>
      </Box>
    </DashboardCard>
  );
}
