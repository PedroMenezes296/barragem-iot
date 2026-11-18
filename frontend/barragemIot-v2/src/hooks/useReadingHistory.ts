"use client";
import { useMemo, useState } from "react";
import type { Reading } from "@/types/domain";
import { clampPage, filterReadings, type HistoryPeriod } from "@/utils/history";

export function useReadingHistory(readings: Reading[]) {
  const [period, setPeriod] = useState<HistoryPeriod>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const filtered = useMemo(
    () => filterReadings(readings, period),
    [readings, period],
  );
  const safePage = clampPage(page, filtered.length, rowsPerPage);
  return {
    period,
    page: safePage,
    rowsPerPage,
    total: filtered.length,
    visible: filtered.slice(
      safePage * rowsPerPage,
      (safePage + 1) * rowsPerPage,
    ),
    changePeriod: (next: HistoryPeriod) => {
      setPeriod(next);
      setPage(0);
    },
    changePage: setPage,
    changeRowsPerPage: (size: number) => {
      setRowsPerPage(size);
      setPage(0);
    },
  };
}
