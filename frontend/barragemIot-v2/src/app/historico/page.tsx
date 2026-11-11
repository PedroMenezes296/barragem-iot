import ReadingHistory from '@/components/history/ReadingHistory';
import { dashboardService } from '@/services/dashboard.service';
export default function HistoryPage() { return <ReadingHistory readings={dashboardService.getReadings()} />; }
