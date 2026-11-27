import { ConfigService } from '@nestjs/config';
import { MeteorologiaService } from './meteorologia.service.js';

describe('Weather forecast', () => {
  const settings: Record<string, string> = {
    WEATHER_LATITUDE: '-23.55',
    WEATHER_LONGITUDE: '-46.63',
    WEATHER_TIMEZONE: 'America/Sao_Paulo',
    WEATHER_LOCATION_NAME: 'Cidade de teste',
  };
  let fetchMock: ReturnType<typeof vi.fn>;
  const service = (config = settings) =>
    new MeteorologiaService(new ConfigService(config));
  const payload = (start = '2026-11-25') => ({
    daily_units: { precipitation_sum: 'mm' },
    daily: {
      time: Array.from({ length: 7 }, (_, i) =>
        new Date(Date.parse(start + 'T00:00:00Z') + i * 86400000)
          .toISOString()
          .slice(0, 10),
      ),
      precipitation_sum: [0, 2.5, null, 4, 5, 6, 7],
    },
  });
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-25T15:00:00Z'));
    fetchMock = vi
      .fn()
      .mockImplementation(async () => Response.json(payload()));
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('requests seven local days in mm and preserves zero and missing values', async () => {
    const result = await service().getForecast();
    expect(result.dias).toHaveLength(7);
    expect(result.dias[0]).toEqual({ data: '2026-11-25', precipitacaoMm: 0 });
    expect(result.dias[2].precipitacaoMm).toBeNull();
    const url = fetchMock.mock.calls[0][0] as URL;
    expect(url.origin).toBe('https://api.open-meteo.com');
    expect(url.searchParams.get('daily')).toBe('precipitation_sum');
    expect(url.searchParams.get('forecast_days')).toBe('7');
    expect(url.searchParams.get('timezone')).toBe('America/Sao_Paulo');
  });
  it('coalesces simultaneous requests and expires after fifteen minutes', async () => {
    const instance = service();
    await Promise.all([instance.getForecast(), instance.getForecast()]);
    await instance.getForecast();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date('2026-11-25T15:15:00Z'));
    await instance.getForecast();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('rolls the window at local midnight even with an unexpired cache', async () => {
    vi.setSystemTime(new Date('2026-11-26T02:59:00Z'));
    const instance = service();
    await instance.getForecast();
    vi.setSystemTime(new Date('2026-11-26T03:00:00Z'));
    fetchMock.mockResolvedValueOnce(Response.json(payload('2026-11-26')));
    expect((await instance.getForecast()).dias[0].data).toBe('2026-11-26');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it.each([
    { WEATHER_LATITUDE: '' },
    { WEATHER_LONGITUDE: '181' },
    { WEATHER_LATITUDE: '-91' },
    { WEATHER_TIMEZONE: 'Invalid/Zone' },
  ])(
    'rejects invalid configuration %o before contacting the provider',
    async (overrides) => {
      await expect(
        service({ ...settings, ...overrides }).getForecast(),
      ).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
  it.each(['missing', 'dates', 'negative', 'unit', 'http', 'timeout'])(
    'does not fabricate data after %s errors and retries after a minute',
    async (scenario) => {
      const body = payload();
      if (scenario === 'missing') body.daily.time.pop();
      if (scenario === 'dates') body.daily.time[0] = '2026-11-24';
      if (scenario === 'negative') body.daily.precipitation_sum[0] = -1;
      if (scenario === 'unit') body.daily_units.precipitation_sum = 'inch';
      if (scenario === 'http')
        fetchMock.mockResolvedValueOnce(new Response('', { status: 503 }));
      else if (scenario === 'timeout')
        fetchMock.mockRejectedValueOnce(new Error('Timeout'));
      else fetchMock.mockResolvedValueOnce(Response.json(body));
      const instance = service();
      await expect(instance.getForecast()).rejects.toThrow(
        'Previsão temporariamente indisponível.',
      );
      await expect(instance.getForecast()).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(1);
      vi.setSystemTime(new Date('2026-11-25T15:01:00Z'));
      await expect(instance.getForecast()).resolves.toHaveProperty('dias');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    },
  );
});
