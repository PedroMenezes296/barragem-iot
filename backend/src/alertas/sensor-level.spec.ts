import { calculateLevel, calculatePercentage } from './sensor-level.js';
import { classifyLevel } from './alertas.service.js';
import type { AlarmConfigDto } from './alertas.dto.js';

const config: AlarmConfigDto = {
  idDispositivo: 'arduino-mega-01', ativo: true, distanciaFundoCm: 100,
  secaCm: 16, atencaoCm: 72, inundacaoCm: 80,
  atualizadoEm: null, nivelMaximoConfiguravelCm: 98,
};

describe('Independent reservoir calculations (same scenarios as firmware)', () => {
  it.each([
    [100, 0, 0, 'seca'],
    [84, 16, 20, 'seca'],
    [83.99, 16.01, 20.01, 'normal'],
    [28.01, 71.99, 89.99, 'normal'],
    [28, 72, 90, 'atencao'],
    [20.01, 79.99, 99.99, 'atencao'],
    [20, 80, 100, 'inundacao'],
    [15, 85, 106.25, 'inundacao'],
    [2, 98, 122.5, 'inundacao'],
  ])('distance %s produces level %s and percentage %s', (distance, expectedLevel, percentage, state) => {
    const level = calculateLevel(config.idDispositivo, distance as number, config);
    expect(level).toBe(expectedLevel);
    expect(calculatePercentage(level, config.inundacaoCm)).toBe(percentage);
    expect(classifyLevel(level!, config)).toBe(state);
  });
  it.each([null, undefined, NaN, Infinity, 0, 1.99, 100.01, 401])('never invents level or percentage from %s', distance => {
    const level = calculateLevel(config.idDispositivo, distance, config);
    expect(level).toBeNull();
    expect(calculatePercentage(level, config.inundacaoCm)).toBeNull();
  });
  it('calculates without depending on the Arduino result or enabling the alarms', () => {
    const level = calculateLevel(config.idDispositivo, 28, Object.assign({}, config, { ativo: false }));
    expect(level).toBe(72);
    expect(calculatePercentage(level, config.inundacaoCm)).toBe(90);
    expect(calculatePercentage(10, 0)).toBeNull();
    expect(calculatePercentage(10, null)).toBeNull();
    expect(calculatePercentage(5.35, 200)).toBe(2.68);
  });
});
