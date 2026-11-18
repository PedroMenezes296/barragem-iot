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
