'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import WavesRounded from '@mui/icons-material/WavesRounded';
import SpaceDashboardRounded from '@mui/icons-material/SpaceDashboardRounded';
import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import NotificationsActiveRounded from '@mui/icons-material/NotificationsActiveRounded';
const width = 252;
const links = [{ href: '/', label: 'Visão geral', icon: <SpaceDashboardRounded /> }, { href: '/historico', label: 'Histórico', icon: <ShowChartRounded /> }, { href: '/alertas', label: 'Alertas', icon: <NotificationsActiveRounded /> }];
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <Box sx={{ p: 2.5 }}><Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 5, px: 1 }}><Box sx={{ width: 40, height: 40, borderRadius: 2.5, bgcolor: 'primary.main', display: 'grid', placeItems: 'center', color: '#fff' }}><WavesRounded /></Box><Box><Typography sx={{ fontWeight: 750 }}>BarragemIot</Typography><Typography variant="caption" color="text.secondary">MONITORAMENTO HÍDRICO</Typography></Box></Box><Typography variant="overline" color="text.secondary" sx={{ px: 1.5 }}>MENU PRINCIPAL</Typography><List sx={{ mt: 1 }}>{links.map(link => <ListItemButton key={link.href} component={Link} href={link.href} selected={pathname === link.href} onClick={onNavigate} sx={{ borderRadius: 2.5, mb: .5, '&.Mui-selected': { bgcolor: 'rgba(91,141,239,.15)', color: 'primary.light' } }}><ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{link.icon}</ListItemIcon><ListItemText primary={link.label} /></ListItemButton>)}</List><Box sx={{ mt: 'auto', pt: 8, px: 1 }}><Typography variant="caption" color="text.secondary">Projeto Integrador V · Protótipo</Typography></Box></Box>;
}
export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) { return <><Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width, boxSizing: 'border-box', bgcolor: '#0D1D31', borderRight: 1, borderColor: 'divider' } }}><SidebarContent /></Drawer><Drawer variant="temporary" open={open} onClose={onClose} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width, bgcolor: '#0D1D31' } }}><SidebarContent onNavigate={onClose} /></Drawer></>; }
