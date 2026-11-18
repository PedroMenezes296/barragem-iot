import { Card, CardContent } from '@mui/material';
import type { ReactNode } from 'react';
export default function DashboardCard({ children, sx }: { children: ReactNode; sx?: object }) { return <Card sx={{ height: '100%', borderRadius: 4, ...sx }}><CardContent sx={{ p: { xs: 2.25, md: 3 }, '&:last-child': { pb: { xs: 2.25, md: 3 } } }}>{children}</CardContent></Card>; }
