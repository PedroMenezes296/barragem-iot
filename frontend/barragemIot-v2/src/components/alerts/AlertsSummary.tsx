import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import type { AlertSeverity, MonitoringAlert } from '@/types/domain';

const categories = [
  { severity: 'critical', label: 'Críticos', detail: 'Eventos de maior prioridade', color: 'error', Icon: ErrorOutlineRounded },
  { severity: 'warning', label: 'Atenção', detail: 'Condições para acompanhar', color: 'warning', Icon: WarningAmberRounded },
  { severity: 'info', label: 'Informações', detail: 'Atualizações do monitoramento', color: 'info', Icon: InfoOutlined },
] as const;

export default function AlertsSummary({ alerts, filter, onFilterChange }: {
  alerts: MonitoringAlert[]; filter: AlertSeverity | 'all'; onFilterChange: (filter: AlertSeverity | 'all') => void;
}) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
    {categories.map(({ severity, label, detail, color, Icon }) => {
      const count = alerts.filter(alert => alert.severity === severity).length;
      return <ButtonBase key={severity} onClick={() => onFilterChange(filter === severity ? 'all' : severity)} aria-pressed={filter === severity}
        sx={{ p: 2.5, borderRadius: 3, textAlign: 'left', justifyContent: 'flex-start', bgcolor: 'background.paper', border: 1, borderColor: filter === severity ? color + '.main' : 'divider', '&:hover': { bgcolor: 'action.hover' }, '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 3 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box sx={{ p: 1.25, borderRadius: 2, display: 'flex', bgcolor: 'action.hover', color: color + '.main' }}><Icon /></Box>
          <Box><Typography variant="h5" component="span">{count}</Typography><Typography component="span" sx={{ ml: 1, fontWeight: 600 }}>{label}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{detail}</Typography></Box>
        </Stack>
      </ButtonBase>;
    })}
  </Box>;
}
