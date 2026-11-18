'use client';
import { useState } from 'react';
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded';
import DashboardCard from '@/components/ui/DashboardCard';

export default function EmailSubscriptionForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(false);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Informe um endereço de e-mail válido.');
      return;
    }
    setError('');
    setSuccess(true);
  };
  return <DashboardCard><Box component="form" onSubmit={submit} noValidate>
    <Stack spacing={2.5}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}><MailOutlineRounded color="primary" /><Chip label="Em demonstração" size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'divider', fontSize: 11 }} /></Stack>
      <Box><Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>Receba alertas por e-mail</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>Experimente o cadastro para futuras notificações do monitoramento.</Typography></Box>
      <TextField fullWidth size="small" label="Endereço de e-mail" type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); setSuccess(false); }} error={Boolean(error)} helperText={error || 'Use um endereço no formato nome@exemplo.com.'} />
      <Button type="submit" variant="contained" fullWidth>Simular cadastro</Button>
      {success && <Alert severity="success" role="status">Cadastro simulado. Notificações reais ainda não estão habilitadas.</Alert>}
      <Typography variant="caption" color="text.secondary">Nenhum e-mail será enviado. O endereço não será transmitido nem armazenado.</Typography>
    </Stack>
  </Box></DashboardCard>;
}
