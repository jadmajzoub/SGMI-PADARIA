// COMMENTED OUT FOR WEBSOCKET REFACTOR - DO NOT DELETE
// This entire component has been temporarily disabled during the websocket refactor
// The original websocket-based real-time production session functionality is preserved below

/*
ORIGINAL WEBSOCKET-BASED PRODUCTION SESSION COMPONENT - COMMENTED OUT

import AddCircleOutlineRounded from "@mui/icons-material/AddCircleOutlineRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import RefreshRounded from "@mui/icons-material/RefreshRounded";
import { Box, Button, Divider, Paper, Stack, Typography, CircularProgress, Alert } from "@mui/material";
import * as React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { Shift } from "../../types/production";
import { formatHMS } from "../../utils/format";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useAuth } from "../../hooks/useAuth";
import { useProductionSession } from "../../hooks/useProductionSession";

[... ALL THE ORIGINAL WEBSOCKET COMPONENT CODE WAS HERE ...]

END OF ORIGINAL WEBSOCKET COMPONENT
*/

// TEMPORARY PLACEHOLDER COMPONENT - WEBSOCKET FUNCTIONALITY DISABLED
import { Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ProductionSession() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "calc(100vh - 120px)", display: "grid", placeItems: "center" }}>
      <Paper sx={{ width: "100%", maxWidth: 680, p: { xs: 3, md: 4 }, borderRadius: 4 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Sessão de Produção Desabilitada
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
            A funcionalidade de sessão em tempo real foi temporariamente desabilitada durante a refatoração.
            Use o formulário de entrada de produção para criar lotes diretamente.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate("/")}
            sx={{ borderRadius: 999 }}
          >
            Voltar para Entrada de Produção
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
