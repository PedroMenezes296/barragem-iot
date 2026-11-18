"use client";
import { Box, MenuItem, Paper, Select, Typography } from "@mui/material";
import type { HistoryPeriod } from "@/utils/history";
export default function HistoryFilters({
  period,
  total,
  deviceLabel,
  onPeriodChange,
}: {
  period: HistoryPeriod;
  total: number;
  deviceLabel: string;
  onPeriodChange: (period: HistoryPeriod) => void;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 3, p: 2.5, bgcolor: "background.paper" }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 650 }}>
            Reservatório experimental
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Dispositivo {deviceLabel} · {total} registros
          </Typography>
        </Box>
        <Select
          size="small"
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as HistoryPeriod)}
          sx={{ minWidth: 190 }}
          aria-label="Filtrar período"
        >
          <MenuItem value="all">Todo o período</MenuItem>
          <MenuItem value="1">Últimas 24 horas</MenuItem>
          <MenuItem value="7">Últimos 7 dias</MenuItem>
        </Select>
      </Box>
    </Paper>
  );
}
