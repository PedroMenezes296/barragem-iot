'use client';
import { useState } from 'react';
import { Box, Button, Chip, Collapse, Stack, Typography } from '@mui/material';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import type { MonitoringAlert } from '@/types/domain';
import { formatDateTime } from '@/utils/formatters';

const presentation = {
  info: { label: 'Informação', color: 'info', Icon: InfoOutlined },
  warning: { label: 'Atenção', color: 'warning', Icon: WarningAmberRounded },
  critical: { label: 'Crítico', color: 'error', Icon: ErrorOutlineRounded },
} as const;

export default function AlertCard({ alert }: { alert: MonitoringAlert }) {
  const [expanded, setExpanded] = useState(false);
  const { label, color, Icon } = presentation[alert.severity];
  const detailsId = 'conditions-' + alert.id;
  return <Box component="article" sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 3 }}>
    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Box sx={{ display: 'flex', p: 1, borderRadius: 2, bgcolor: 'action.hover', color: color + '.main', flexShrink: 0 }}><Icon /></Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
          <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>{alert.title}</Typography>
          <Chip size="small" label={label} color={color} variant="outlined" sx={{ alignSelf: 'flex-start', height: 24, fontSize: 11 }} />
        </Stack>
        <Typography variant="caption" color="text.secondary" component="time" dateTime={alert.generatedAt}>{formatDateTime(alert.generatedAt)}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>{alert.description}</Typography>
        <Button size="small" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} aria-controls={detailsId} endIcon={<ExpandMoreRounded sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />} sx={{ mt: 1, ml: -1 }}>{expanded ? 'Ocultar condições' : 'Ver condições'}</Button>
        <Collapse in={expanded} id={detailsId}>
          <Box sx={{ mt: 1, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>Condições simuladas</Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0, mt: 1, color: 'text.secondary' }}>{alert.conditions.map(condition => <Typography component="li" variant="body2" key={condition} sx={{ mb: .75 }}>{condition}</Typography>)}</Box>
          </Box>
        </Collapse>
      </Box>
    </Stack>
  </Box>;
}
