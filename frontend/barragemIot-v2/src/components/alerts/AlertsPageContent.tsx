'use client';
import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import AlertsList from './AlertsList';
import AlertsSummary from './AlertsSummary';
import EmailSubscriptionForm from './EmailSubscriptionForm';
import type { AlertSeverity, MonitoringAlert } from '@/types/domain';

export default function AlertsPageContent({ alerts }: { alerts: MonitoringAlert[] }) {
  const [filter, setFilter] = useState<AlertSeverity | 'all'>('all');
  const sorted = [...alerts].sort((a, b) => Date.parse(b.generatedAt) - Date.parse(a.generatedAt));
  const filtered = sorted.filter(alert => filter === 'all' || alert.severity === filter);
  return <Stack spacing={3}>
    <Box><Typography variant="h4" component="h1">Alertas</Typography><Typography color="text.secondary" sx={{ mt: .7 }}>Identifique os eventos que merecem atenção e consulte suas condições.</Typography></Box>
    <AlertsSummary alerts={alerts} filter={filter} onFilterChange={setFilter} />
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 320px' }, gap: 3, alignItems: 'start' }}>
      <AlertsList alerts={filtered} filter={filter} onFilterChange={setFilter} total={alerts.length} />
      <Box component="aside" aria-label="Notificações por e-mail"><EmailSubscriptionForm /></Box>
    </Box>
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', color: 'text.secondary' }}><InfoOutlined sx={{ fontSize: 18, mt: .2 }} /><Typography variant="caption">Eventos demonstrativos. As condições são simuladas e não constituem avaliação de segurança da barragem ou limites operacionais validados.</Typography></Stack>
  </Stack>;
}
