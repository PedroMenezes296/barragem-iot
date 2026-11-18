import ReadingHistory from "@/components/history/ReadingHistory";
import { getReadingData } from "@/services/readings.service";
export default async function HistoryPage() {
  return <ReadingHistory {...await getReadingData()} />;
}
