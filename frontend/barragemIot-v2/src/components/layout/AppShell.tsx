'use client';
import { useState } from 'react';
import { Box } from '@mui/material';
import Sidebar from './Sidebar';
import Header from './Header';
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}><Sidebar open={open} onClose={() => setOpen(false)} /><Box sx={{ ml: { md: '252px' } }}><Header onMenu={() => setOpen(true)} /><Box component="main" sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 2, sm: 3, lg: 4 } }}>{children}</Box></Box></Box>;
}
