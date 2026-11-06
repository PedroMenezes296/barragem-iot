export function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatNumber(value: number | null | undefined, digits = 1): string {
  return value == null ? "—" : value.toFixed(digits).replace(".", ",");
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
