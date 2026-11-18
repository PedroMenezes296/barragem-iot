import { Box, Typography } from '@mui/material';
import DashboardCard from '@/components/ui/DashboardCard';
import type { ReactNode } from 'react';
export default function MetricCard({ label, value, detail, icon }: { label: string; value: string; detail: ReactNode; icon: ReactNode }) { return <DashboardCard><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><Box><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h5" sx={{ mt: 1 }}>{value}</Typography><Typography component="div" variant="caption" color="text.secondary">{detail}</Typography></Box><Box sx={{ p: 1.1, bgcolor: 'rgba(91,141,239,.13)', color: 'primary.light', borderRadius: 2 }}>{icon}</Box></Box></DashboardCard>; }
