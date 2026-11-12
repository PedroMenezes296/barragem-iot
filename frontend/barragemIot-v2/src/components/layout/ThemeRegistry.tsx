'use client';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@/theme/theme';
export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return <AppRouterCacheProvider><ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider></AppRouterCacheProvider>;
}
