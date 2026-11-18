"use client";
import { createContext, useContext } from "react";
import type { AlarmPageData } from "@/types/alarms";

export interface AlarmMonitor extends AlarmPageData {
  soundEnabled: boolean;
  enableSound: () => Promise<void>;
  disableSound: () => void;
}
export const AlarmMonitorContext = createContext<AlarmMonitor | null>(null);
export function useAlarmMonitor() {
  return useContext(AlarmMonitorContext);
}
