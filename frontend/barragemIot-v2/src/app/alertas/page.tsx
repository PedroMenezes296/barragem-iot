import AlertsPageContent from '@/components/alerts/AlertsPageContent';
import { dashboardService } from '@/services/dashboard.service';
export default function AlertsPage() { return <AlertsPageContent alerts={dashboardService.getAlerts()} />; }
