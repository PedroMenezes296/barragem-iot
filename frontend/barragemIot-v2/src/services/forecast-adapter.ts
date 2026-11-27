import type { ForecastResponseDto } from "@/generated/api/models";
import type { ForecastData } from "@/types/domain";

export function toForecast(dto: ForecastResponseDto): ForecastData {
  if (
    !Array.isArray(dto.dias) ||
    dto.dias.length !== 7 ||
    !Number.isFinite(Date.parse(dto.consultadoEm))
  )
    throw new Error("Previsão inválida.");
  new Intl.DateTimeFormat("pt-BR", { timeZone: dto.fusoHorario });
  const days = dto.dias.map((day, index) => {
    const parsed = Date.parse(`${day.data}T00:00:00Z`);
    const expected =
      Date.parse(`${dto.dias[0].data}T00:00:00Z`) + index * 86400000;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(day.data) ||
      !Number.isFinite(parsed) ||
      parsed !== expected ||
      (day.precipitacaoMm !== null &&
        (typeof day.precipitacaoMm !== "number" ||
          !Number.isFinite(day.precipitacaoMm) ||
          day.precipitacaoMm < 0))
    )
      throw new Error("Dia de previsão inválido.");
    return { date: day.data, precipitationMm: day.precipitacaoMm };
  });
  return {
    source: "api",
    days,
    location: dto.localidade,
    timezone: dto.fusoHorario,
    fetchedAt: dto.consultadoEm,
    error: null,
  };
}
