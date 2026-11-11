import type { MonitoringAlert } from '@/types/domain';
export const alerts: MonitoringAlert[] = [
  { id: 'ALT-104', title: 'Chuva intensa prevista', description: 'A previsão simulada indica precipitação acima da média nos próximos dias.', severity: 'warning', generatedAt: '2026-11-10T13:45:00-03:00', conditions: ['35 mm previstos para quinta-feira', 'Acumulado de 7 dias: 122 mm'] },
  { id: 'ALT-103', title: 'Variação entre sensores', description: 'Os sensores apresentam uma diferença pontual nas leituras demonstrativas.', severity: 'info', generatedAt: '2026-11-10T12:30:00-03:00', conditions: ['Leitura simulada', 'Verificação visual recomendada no protótipo'] },
  { id: 'ALT-102', title: 'Leituras disponíveis', description: 'Os dados fictícios mais recentes estão disponíveis para visualização.', severity: 'info', generatedAt: '2026-11-10T11:00:00-03:00', conditions: ['2 sensores com dados', 'Dispositivo de demonstração online'] },
];
