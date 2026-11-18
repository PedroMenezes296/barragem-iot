"use client";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import type { Reading } from "@/types/domain";
import { formatDateTime, formatValue } from "@/utils/formatters";
interface Props {
  readings: Reading[];
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
}
export default function ReadingsTable({
  readings,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: Props) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: 3, bgcolor: "background.paper" }}
    >
      <Table size="small" aria-label="Histórico de leituras">
        <TableHead>
          <TableRow>
            {[
              "Data e hora",
              "ID leitura",
              "Distância ultrassônica",
              "Nível ultrassônico",
              "Nível resistivo",
              "Umidade",
              "Estado",
            ].map((x) => (
              <TableCell
                key={x}
                sx={{
                  whiteSpace: "nowrap",
                  color: "text.secondary",
                  fontWeight: 650,
                }}
              >
                {x}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {readings.map((r) => (
            <TableRow hover key={r.id}>
              <TableCell sx={{ whiteSpace: "nowrap" }}>
                {formatDateTime(r.timestamp)}
              </TableCell>
              <TableCell>{r.readingId ?? r.id}</TableCell>
              <TableCell>{formatValue(r.distanceCm, " cm")}</TableCell>
              <TableCell>{formatValue(r.ultrasonicLevelCm, " cm")}</TableCell>
              <TableCell>{formatValue(r.resistiveLevelCm, " cm")}</TableCell>
              <TableCell>{formatValue(r.humidityPct, "%")}</TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  color={
                    r.ultrasonicLevelCm === null || r.resistiveLevelCm === null
                      ? "warning.main"
                      : "success.main"
                  }
                >
                  {r.ultrasonicLevelCm === null || r.resistiveLevelCm === null
                    ? "Parcial"
                    : "Disponível"}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
          {!readings.length && (
            <TableRow>
              <TableCell
                colSpan={7}
                align="center"
                sx={{ py: 6, color: "text.secondary" }}
              >
                Nenhuma leitura encontrada neste período.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, next) => onPageChange(next)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        rowsPerPageOptions={[10, 20, 36]}
        labelRowsPerPage="Linhas:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} de ${count}`
        }
      />
    </TableContainer>
  );
}
