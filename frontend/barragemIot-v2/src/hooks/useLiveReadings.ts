"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  subscribeToReadings,
  type LiveConnectionStatus,
} from "@/lib/readings-socket";

export function useLiveReadings(
  url?: string,
): LiveConnectionStatus | "disabled" {
  const router = useRouter();
  const [status, setStatus] = useState<LiveConnectionStatus>("connecting");
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!url) return;
    return subscribeToReadings(url, {
      onStatus: setStatus,
      onRefresh: () => startTransition(() => router.refresh()),
    });
  }, [url, router]);

  return url ? status : "disabled";
}
