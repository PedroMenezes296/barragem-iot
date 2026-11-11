import type { Metadata } from 'next';
import ThemeRegistry from '@/components/layout/ThemeRegistry';
import AppShell from '@/components/layout/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'BarragemIot | Monitoramento hídrico',
  description: 'Dashboard demonstrativo de monitoramento hídrico do BarragemIot.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><ThemeRegistry><AppShell>{children}</AppShell></ThemeRegistry></body></html>;
}
