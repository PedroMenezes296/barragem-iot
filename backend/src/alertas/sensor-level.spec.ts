import { calculateLevel, calculatePercentage } from './sensor-level.js';
import { classifyLevel } from './alertas.service.js';
import type { AlarmConfigDto } from './alertas.dto.js';

const config: AlarmConfigDto = {
  versao: 2,
  idDispositivo: 'arduino-mega-01',
  ativo: true,
  distanciaFundoCm: 120,
  alturaCheioCm: 100,
  secaPct: 20,
  atencaoPct: 80,
  inundacaoPct: 95,
  secaCm: null,
  atencaoCm: null,
  inundacaoCm: null,
  atualizadoEm: null,
  nivelMaximoConfiguravelCm: 118,
};

describe('Percentual e intervalos iguais aos do firmware', () => {
  it.each([
    [0, 'seca'],
    [19.99, 'seca'],
    [20, 'seca'],
    [20.01, 'normal'],
    [79.99, 'normal'],
    [80, 'atencao'],
    [94.99, 'atencao'],
    [95, 'inundacao'],
    [100, 'inundacao'],
    [110, 'inundacao'],
  ])('classifica %s por cento como %s', (percent, state) => {
    const level = calculateLevel(config.idDispositivo, 120 - percent, config);
    expect(level).toBe(percent);
    expect(calculatePercentage(level, config.alturaCheioCm)).toBe(percent);
    expect(classifyLevel(level!, config)).toBe(state);
  });
  it.each([null, undefined, NaN, Infinity, 0, 1.99, 120.01, 401])(
    'não inventa zero para %s',
    (distance) => {
      const level = calculateLevel(config.idDispositivo, distance, config);
      expect(level).toBeNull();
      expect(calculatePercentage(level, config.alturaCheioCm)).toBeNull();
    },
  );
  it('classifica saltos e permanência, independentemente da amostra anterior', () => {
    expect(
      [10, 90, 99, 99, 50, 0].map((level) => classifyLevel(level, config)),
    ).toEqual(['seca', 'atencao', 'inundacao', 'inundacao', 'normal', 'seca']);
  });
  it('mantém a porcentagem sem alarmes e arredonda antes de classificar', () => {
    const disabled = Object.assign({}, config, { ativo: false });
    expect(calculateLevel(config.idDispositivo, 40, disabled)).toBe(80);
    expect(calculatePercentage(80, disabled.alturaCheioCm)).toBe(80);
    expect(classifyLevel(80, disabled)).toBe('desativado');
    expect(calculatePercentage(10, 0)).toBeNull();
    expect(calculatePercentage(10, null)).toBeNull();
    expect(calculatePercentage(5.35, 200)).toBe(2.68);
    expect(
      classifyLevel(159.99, Object.assign({}, config, { alturaCheioCm: 200 })),
    ).toBe('atencao');
  });
});
