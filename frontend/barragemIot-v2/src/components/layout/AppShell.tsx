"use client";
import { useState } from "react";
import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useLiveReadings } from "@/hooks/useLiveReadings";
export default function AppShell({
  children,
  sourceLabel = "Modo demonstração",
  websocketUrl,
}: {
  children: React.ReactNode;
  sourceLabel?: string;
  websocketUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const liveStatus = useLiveReadings(websocketUrl);
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <Box sx={{ ml: { md: "252px" } }}>
        <Header
          onMenu={() => setOpen(true)}
          sourceLabel={sourceLabel}
          liveStatus={liveStatus}
        />
        <Box
          component="main"
          sx={{ maxWidth: 1600, mx: "auto", p: { xs: 2, sm: 3, lg: 4 } }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
