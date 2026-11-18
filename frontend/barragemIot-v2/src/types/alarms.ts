import type { AlarmConfigDto, AlarmStatusDto } from "@/generated/api/models";

export interface AlarmPageData {
  config: AlarmConfigDto | null;
  status: AlarmStatusDto | null;
  error: string | null;
  source: "api" | "mock";
}
