"use client";
import { Alert, Box, Stack, Typography } from "@mui/material";
import type { ReadingData } from "@/types/domain";
import { useReadingHistory } from "@/hooks/useReadingHistory";
import HistoryFilters from "./HistoryFilters";
import ReadingsTable from "./ReadingsTable";

export default function ReadingHistory({
  readings,
  source,
  error,
}: ReadingData) {
  const history = useReadingHistory(readings);
  const mock = source === "mock";
  const deviceLabel = mock
    ? "BRG-DEV-001"
    : [...new Set(readings.map((reading) => reading.deviceId))].join(", ") ||
      "—";
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Histórico de leituras</Typography>
        <Typography color="text.secondary" sx={{ mt: 0.7 }}>
          {mock
            ? "Registros técnicos do dispositivo de demonstração."
            : "Registros técnicos consultados na API."}
        </Typography>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      <HistoryFilters
        period={history.period}
        total={history.total}
        deviceLabel={deviceLabel}
        onPeriodChange={history.changePeriod}
      />
      <ReadingsTable
        readings={history.visible}
        total={history.total}
        page={history.page}
        rowsPerPage={history.rowsPerPage}
        onPageChange={history.changePage}
        onRowsPerPageChange={history.changeRowsPerPage}
      />
      <Typography variant="caption" color="text.secondary">
        Valores ausentes são exibidos como —.{" "}
        {mock
          ? "Leituras simuladas para fins de demonstração."
          : "Leituras obtidas do backend. Filtros e paginação aplicados localmente."}
      </Typography>
    </Stack>
  );
}
