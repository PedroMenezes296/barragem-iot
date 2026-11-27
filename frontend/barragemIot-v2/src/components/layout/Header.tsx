"use client";
import {
  AppBar,
  Box,
  Chip,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuRounded from "@mui/icons-material/MenuRounded";
import WaterDropOutlined from "@mui/icons-material/WaterDropOutlined";
import type { LiveConnectionStatus } from "@/lib/readings-socket";
export default function Header({
  onMenu,
  sourceLabel,
  liveStatus,
}: {
  onMenu: () => void;
  sourceLabel: string;
  liveStatus: LiveConnectionStatus | "disabled";
}) {
  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        backdropFilter: "blur(18px)",
        bgcolor: "rgba(11,23,40,.82)",
      }}
    >
      <Toolbar sx={{ minHeight: "72px !important", px: { xs: 2, md: 4 } }}>
        <IconButton
          onClick={onMenu}
          aria-label="Abrir menu"
          sx={{ display: { md: "none" }, mr: 1 }}
        >
          <MenuRounded />
        </IconButton>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: { xs: "none", sm: "block" } }}
        >
          Projeto Integrador V /{" "}
          <Box component="span" color="text.primary">
            Monitoramento
          </Box>
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Chip
          size="small"
          icon={<WaterDropOutlined />}
          label={
            liveStatus === "disabled"
              ? sourceLabel
              : liveStatus === "connected"
                ? "Backend conectado · dados mistos"
                : liveStatus === "connecting"
                  ? "Conectando ao backend"
                  : "Backend desconectado"
          }
          title={
            liveStatus === "disabled"
              ? sourceLabel
              : "Conexão do navegador com o backend. Leituras, nível e previsão usam a API; a lista de eventos permanece demonstrativa. Não confirma o estado do hardware."
          }
          color="info"
          variant="outlined"
          sx={{ borderColor: "rgba(91,141,239,.35)", color: "#9dbbff" }}
        />
      </Toolbar>
    </AppBar>
  );
}
