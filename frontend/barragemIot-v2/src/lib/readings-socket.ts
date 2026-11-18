import { io, type Socket } from "socket.io-client";
import type { LeituraResponseDto } from "@/generated/api/models";

export type LiveConnectionStatus = "connecting" | "connected" | "disconnected";
interface ServerEvents {
  "leitura:criada": (event: Pick<LeituraResponseDto, "id">) => void;
  "alertas:configuracao": () => void;
}
interface Callbacks {
  onStatus: (status: LiveConnectionStatus) => void;
  onRefresh: () => void;
}

export function subscribeToReadings(
  url: string,
  callbacks: Callbacks,
): () => void {
  const socket: Socket<ServerEvents, Record<string, never>> = io(url, {
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 5_000,
    timeout: 10_000,
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const scheduleRefresh = () => {
    // Agrupa rajadas sem adiar indefinidamente uma atualização.
    if (timer !== undefined) return;
    timer = setTimeout(() => {
      timer = undefined;
      callbacks.onRefresh();
    }, 250);
  };
  socket.on("connect", () => {
    callbacks.onStatus("connected");
    // Reconsulta inclusive após reconexão: eventos não são um log durável.
    scheduleRefresh();
  });
  socket.on("disconnect", () => callbacks.onStatus("disconnected"));
  socket.on("connect_error", () => callbacks.onStatus("disconnected"));
  socket.on("alertas:configuracao", scheduleRefresh);
  socket.on("leitura:criada", (event) => {
    if (event && typeof event.id === "string" && event.id.length > 0)
      scheduleRefresh();
  });
  socket.connect();
  return () => {
    if (timer !== undefined) clearTimeout(timer);
    socket.removeAllListeners();
    socket.disconnect();
  };
}
