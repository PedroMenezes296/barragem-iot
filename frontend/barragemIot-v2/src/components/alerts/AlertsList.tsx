import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import NotificationsNoneRounded from '@mui/icons-material/NotificationsNoneRounded';
import type { AlertSeverity, MonitoringAlert } from '@/types/domain';
import AlertCard from './AlertCard';

export default function AlertsList({ alerts, filter, onFilterChange, total }: {
  alerts: MonitoringAlert[]; filter: AlertSeverity | 'all'; onFilterChange: (filter: AlertSeverity | 'all') => void; total: number;
}) {
  return <Stack spacing={2}>
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }} spacing={1}>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>Eventos do monitoramento</Typography>
      <Typography variant="caption" color="text.secondary" aria-live="polite" sx={{ whiteSpace: 'nowrap' }}>{alerts.length} de {total}</Typography>
    </Stack>
    <Tabs value={filter} onChange={(_, value: AlertSeverity | 'all') => onFilterChange(value)} variant="scrollable" scrollButtons="auto" aria-label="Filtrar eventos por severidade" sx={{ borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none', minWidth: 0, px: 2 } }}>
      <Tab value="all" label="Todos" /><Tab value="warning" label="Atenção" /><Tab value="critical" label="Críticos" /><Tab value="info" label="Informações" />
    </Tabs>
    {alerts.length ? alerts.map(alert => <AlertCard key={alert.id} alert={alert} />) : <Box role="status" sx={{ textAlign: 'center', py: 6, px: 2, bgcolor: 'background.paper', borderRadius: 3 }}>
      <NotificationsNoneRounded sx={{ fontSize: 36, color: 'text.secondary', mb: 1 }} />
      <Typography sx={{ fontWeight: 600 }}>Nenhum evento nesta categoria</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Selecione outro filtro para consultar os eventos simulados.</Typography>
    </Box>}
  </Stack>;
}
