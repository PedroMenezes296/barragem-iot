export const formatDateTime = (date: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date));
export const formatDay = (date: string) => new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit' }).format(new Date(date));
export const formatValue = (value: number | null, suffix = '') => value === null ? '—' : `${value.toLocaleString('pt-BR')}${suffix}`;
