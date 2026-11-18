"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlarmMonitorContext } from "@/hooks/useAlarmMonitor";
import { currentAlarmStatus } from "@/utils/alarm-status";
import type { AlarmPageData } from "@/types/alarms";

export default function AlarmMonitorProvider({
  data,
  children,
}: {
  data: AlarmPageData;
  children: ReactNode;
}) {
  const [now, setNow] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const status = currentAlarmStatus(data.status, now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(
    () => () => {
      void audio.current?.close().catch(() => undefined);
    },
    [],
  );
  useEffect(() => {
    if (!status?.alarmeAtivo || !soundEnabled || data.source !== "api") return;
    const beep = () => {
      const context = audio.current;
      if (!context || context.state !== "running") return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.07, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
    };
    beep();
    const timer = setInterval(beep, 5000);
    return () => clearInterval(timer);
  }, [status?.alarmeAtivo, status?.estado, soundEnabled, data.source]);

  async function enableSound() {
    if (!window.AudioContext)
      throw new Error("Este navegador não oferece aviso sonoro.");
    if (!audio.current || audio.current.state === "closed")
      audio.current = new AudioContext();
    await audio.current.resume();
    if (audio.current.state !== "running")
      throw new Error("Não foi possível ativar o som. Tente novamente.");
    setSoundEnabled(true);
  }

  return (
    <AlarmMonitorContext.Provider
      value={{
        ...data,
        status,
        soundEnabled,
        enableSound,
        disableSound: () => setSoundEnabled(false),
      }}
    >
      {children}
    </AlarmMonitorContext.Provider>
  );
}
