import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ForecastResponseDto } from './meteorologia.dto.js';

const CACHE_MS = 15 * 60_000;
const RETRY_MS = 60_000;

function dayAt(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

@Injectable()
export class MeteorologiaService {
  private cached?: { key: string; expires: number; value: ForecastResponseDto };
  private pending?: { key: string; promise: Promise<ForecastResponseDto> };
  private failed?: { key: string; retryAt: number };

  constructor(private readonly config: ConfigService) {}

  async getForecast(): Promise<ForecastResponseDto> {
    const lat = this.config.get<string>('WEATHER_LATITUDE');
    const lon = this.config.get<string>('WEATHER_LONGITUDE');
    const latitude = Number(lat);
    const longitude = Number(lon);
    const timezone =
      this.config.get<string>('WEATHER_TIMEZONE') ?? 'America/Sao_Paulo';
    const location =
      this.config.get<string>('WEATHER_LOCATION_NAME')?.trim() ||
      'Local do reservatório';
    if (
      !lat?.trim() ||
      !lon?.trim() ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new ServiceUnavailableException(
        'Localização do reservatório ainda não configurada para a previsão.',
      );
    }
    let today: string;
    try {
      today = dayAt(new Date(), timezone);
    } catch {
      throw new ServiceUnavailableException(
        'Fuso horário da previsão inválido.',
      );
    }
    const key = JSON.stringify([
      latitude,
      longitude,
      timezone,
      location,
      today,
    ]);
    if (this.cached?.key === key && Date.now() < this.cached.expires)
      return this.cached.value;
    if (this.pending?.key === key) return this.pending.promise;
    if (this.failed?.key === key && Date.now() < this.failed.retryAt) {
      throw new ServiceUnavailableException(
        'Previsão temporariamente indisponível.',
      );
    }
    const promise = this.fetchForecast(
      latitude,
      longitude,
      timezone,
      location,
      today,
    )
      .then((value) => {
        this.cached = { key, expires: Date.now() + CACHE_MS, value };
        this.failed = undefined;
        return value;
      })
      .catch(() => {
        this.failed = { key, retryAt: Date.now() + RETRY_MS };
        throw new ServiceUnavailableException(
          'Previsão temporariamente indisponível.',
        );
      })
      .finally(() => {
        if (this.pending?.key === key) this.pending = undefined;
      });
    this.pending = { key, promise };
    return promise;
  }

  private async fetchForecast(
    latitude: number,
    longitude: number,
    timezone: string,
    location: string,
    today: string,
  ): Promise<ForecastResponseDto> {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      daily: 'precipitation_sum',
      precipitation_unit: 'mm',
      forecast_days: '7',
      timezone,
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Weather HTTP failure');
    const body = (await response.json()) as {
      daily?: { time?: unknown; precipitation_sum?: unknown };
      daily_units?: { precipitation_sum?: unknown };
    };
    const dates = body.daily?.time;
    const values = body.daily?.precipitation_sum;
    if (
      !Array.isArray(dates) ||
      !Array.isArray(values) ||
      dates.length !== 7 ||
      values.length !== 7 ||
      body.daily_units?.precipitation_sum !== 'mm' ||
      dayAt(new Date(), timezone) !== today
    )
      throw new Error('Invalid forecast');
    const start = Date.parse(`${today}T00:00:00Z`);
    const dias = dates.map((date: unknown, i: number) => {
      const expected = new Date(start + i * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const value: unknown = values[i];
      if (
        date !== expected ||
        (value !== null &&
          (typeof value !== 'number' || !Number.isFinite(value) || value < 0))
      )
        throw new Error('Invalid forecast day');
      return { data: expected, precipitacaoMm: value as number | null };
    });
    return {
      fonte: 'Open-Meteo',
      localidade: location,
      fusoHorario: timezone,
      consultadoEm: new Date().toISOString(),
      dias,
    };
  }
}
