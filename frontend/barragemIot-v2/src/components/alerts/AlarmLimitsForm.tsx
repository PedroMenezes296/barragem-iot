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

export interface AlarmLimitsDraft {
  deviceId: string;
  dry: string;
  attention: string;
  flood: string;
  enabled: boolean;
}

interface Props {
  initialValues: AlarmLimitsDraft;
  onSave: (values: AlarmLimitsDraft) => Promise<void>;
  disabled?: boolean;
}

export default function AlarmLimitsForm({
  initialValues,
  onSave,
  disabled,
}: Props) {
  const [draft, setDraft] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

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

  const change = (field: "dry" | "attention" | "flood", value: string) => {
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
              Configure a altura da água, não a distância do sensor até a
              superfície.
            </Typography>
          </Box>
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
              label="Nível mínimo — seca (cm)"
              value={draft.dry}
              onChange={(event) => change("dry", event.target.value)}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
              required
              disabled={disabled || saving}
              helperText="Dispara quando o nível fica igual ou abaixo."
            />
            <TextField
              label="Nível de atenção (cm)"
              value={draft.attention}
              onChange={(event) => change("attention", event.target.value)}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
              required
              disabled={disabled || saving}
              helperText="Dispara ao atingir este nível, antes da inundação."
            />
            <TextField
              label="Nível máximo — inundação (cm)"
              value={draft.flood}
              onChange={(event) => change("flood", event.target.value)}
              slotProps={{ htmlInput: { inputMode: "decimal" } }}
              required
              disabled={disabled || saving}
              helperText="Dispara quando o nível fica igual ou acima."
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Seca &lt; atenção &lt; inundação. Referência sensor–fundo: 5,75 cm.
            Com a distância mínima de 2 cm aceita pelo firmware, o nível máximo
            mensurável é 3,75 cm.
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
