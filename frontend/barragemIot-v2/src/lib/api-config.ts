export function getApiBaseUrl(): string {
  const value = process.env.API_BASE_URL ?? "http://127.0.0.1:3000";
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("API_BASE_URL deve usar HTTP ou HTTPS.");
  }
  return value.replace(/\/+$/, "");
}

export function usesSimulatedReadings(): boolean {
  const mode = process.env.DATA_SOURCE ?? "api";
  if (mode !== "api" && mode !== "mock") {
    throw new Error("DATA_SOURCE deve ser api ou mock.");
  }
  return mode === "mock";
}

// Este endereço é intencionalmente enviado ao navegador. Não usar segredos.
export function getWebsocketPublicUrl(): string {
  const url = new URL(
    process.env.WEBSOCKET_PUBLIC_URL ?? "http://localhost:3000",
  );
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(
      "WEBSOCKET_PUBLIC_URL deve conter apenas a origem HTTP(S) pública do backend.",
    );
  }
  return url.origin;
}
