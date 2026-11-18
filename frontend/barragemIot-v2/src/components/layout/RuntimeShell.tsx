import { connection } from "next/server";
import { usesSimulatedReadings, getWebsocketPublicUrl } from "@/lib/api-config";
import AppShell from "./AppShell";
import AlarmMonitorProvider from "@/components/alerts/AlarmMonitorProvider";
import { getAlarmData } from "@/services/alarms.service";

export default async function RuntimeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const alarmData = await getAlarmData();
  return (
    <AlarmMonitorProvider data={alarmData}>
      <AppShell
        websocketUrl={
          usesSimulatedReadings() ? undefined : getWebsocketPublicUrl()
        }
        sourceLabel={
          usesSimulatedReadings()
            ? "Modo demonstração"
            : "Leituras API · demonstrações locais"
        }
      >
        {children}
      </AppShell>
    </AlarmMonitorProvider>
  );
}
