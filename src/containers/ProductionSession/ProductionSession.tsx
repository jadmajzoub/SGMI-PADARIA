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

type SessionState = {
  product: string;
  shift: Shift;
  date: string; // dd-mm-yyyy
};

export default function ProductionSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query] = useSearchParams();

  const qProduct = query.get("product") ?? (location.state?.product as string | null);
  const qShift = query.get("shift") ?? (location.state?.shift as string | null);
  const qDate = query.get("date") ?? (location.state?.date as string | null);

  React.useEffect(() => {
    if (!qProduct || !qShift || !qDate) navigate("/", { replace: true });
  }, [qProduct, qShift, qDate, navigate]);

  const state = React.useMemo<SessionState | null>(() => {
    if (!qProduct || !qShift || !qDate) return null;
    return { product: qProduct, shift: Number(qShift) as Shift, date: qDate };
  }, [qProduct, qShift, qDate]);

  // Get authentication data
  const { token } = useAuth();

  // WebSocket connection with authentication token
  const { isConnected, lastMessage, sendMessage, connectionError } = useWebSocket(token?.accessToken);
  
  // Production session management with backend integration
  const {
    batchId,
    batchStatus,
    isLoading,
    error,
    currentBatch,
    elapsedSeconds,
    isRunning,
    isPaused,
    canStart,
    canPause,
    canResume,
    startBatch,
    pauseBatch,
    resumeBatch,
    stopBatch,
    createNewBatch,
    refreshBatchStatus,
    handleWebSocketBatchUpdate
  } = useProductionSession(state);

  // Sync WebSocket messages with batch actions
  React.useEffect(() => {
    if (!batchId || !isConnected) return;

    // Send WebSocket messages for batch actions based on status
    if (batchStatus?.status === 'IN_PROGRESS' && lastMessage?.type !== 'batch_status_updated') {
      sendMessage({
        type: 'batch_action',
        data: {
          batchId,
          action: { action: 'start' }
        }
      });
    }
  }, [batchId, batchStatus?.status, isConnected, sendMessage, lastMessage]);

  // Handle WebSocket messages
  React.useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'batch_status_updated':
        console.log('Status do lote atualizado:', lastMessage.data);
        // Use WebSocket data directly instead of fetching from API
        handleWebSocketBatchUpdate(lastMessage.data);
        break;
      case 'batch_created':
        console.log('Lote criado:', lastMessage.data);
        // Use WebSocket data directly instead of fetching from API
        handleWebSocketBatchUpdate(lastMessage.data);
        break;
      case 'connection_established':
        console.log('Conectado ao servidor:', lastMessage.data.message);
        break;
      default:
        console.log('Mensagem WebSocket desconhecida:', lastMessage.type);
    }
  }, [lastMessage, handleWebSocketBatchUpdate]);

  if (!state) return null;

  // Convert DD-MM-YYYY format to Date object
  const parseDateFromDDMMYYYY = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('-');
    return new Date(`${year}-${month}-${day}T00:00:00`);
  };

  const title = `${state.product} — Turno ${state.shift}`;
  const displayDate = parseDateFromDDMMYYYY(state.date).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const handleStart = () => {
    startBatch();
  };

  const handlePause = () => {
    if (isRunning) {
      pauseBatch();
    } else if (isPaused) {
      resumeBatch();
    }
  };

  const handleReset = () => {
    stopBatch();
  };

  const handleNewBatch = () => {
    createNewBatch();
  };

  // Show loading state during initialization
  if (isLoading && !batchStatus) {
    return (
      <Box sx={{ minHeight: "calc(100vh - 120px)", display: "grid", placeItems: "center" }}>
        <Paper sx={{ width: "100%", maxWidth: 820, p: { xs: 3, md: 5 }, borderRadius: 4 }}>
          <Stack spacing={3} alignItems="center">
            <CircularProgress size={50} />
            <Typography variant="h6">Inicializando sessão de produção...</Typography>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "calc(100vh - 120px)", display: "grid", placeItems: "center" }}>
      <Paper sx={{ width: "100%", maxWidth: 820, p: { xs: 3, md: 5 }, borderRadius: 4 }}>
        <Stack spacing={3} alignItems="center">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: 0.3 }}>
              {title}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
              {displayDate}
            </Typography>
            {batchStatus && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Lote {currentBatch} • Status: {batchStatus.status}
              </Typography>
            )}
          </Box>

          {/* Error display */}
          {error && (
            <Alert severity="error" sx={{ width: "100%", maxWidth: 560 }}>
              {error}
            </Alert>
          )}

          {/* Stat panel */}
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, width: "100%", maxWidth: 560 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              divider={<Box sx={{ display: { xs: "none", sm: "block" }, width: 1, borderRight: "1px solid", borderColor: "divider" }} />}
              spacing={{ xs: 2, sm: 0 }}
              sx={{ alignItems: "stretch" }}
            >
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Lote Atual
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {currentBatch}
                </Typography>
              </Box>

              <Box sx={{ display: { xs: "block", sm: "none" }, height: 1, borderTop: "1px solid", borderColor: "divider", my: 1 }} />

              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Tempo Decorrido
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {formatHMS(elapsedSeconds)}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Actions */}
          <Stack
            direction="row"
            spacing={2}
            sx={{ width: "100%", maxWidth: 720, mt: 1, flexWrap: "wrap" }}
          >
            <Box sx={{ flex: "1 1 160px" }}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="success"
                startIcon={<PlayArrowRounded />}
                onClick={handleStart}
                disabled={!canStart || isLoading}
                sx={{ height: 48, borderRadius: 2 }}
              >
                Iniciar
              </Button>
            </Box>

            <Box sx={{ flex: "1 1 160px" }}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="secondary"
                startIcon={<AddCircleOutlineRounded />}
                onClick={handleNewBatch}
                disabled={isLoading || isRunning}
                sx={{ height: 48, borderRadius: 2 }}
              >
                Nova Batelada
              </Button>
            </Box>

            <Box sx={{ flex: "1 1 160px" }}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="warning"
                startIcon={<PauseRounded />}
                onClick={handlePause}
                disabled={!canPause && !canResume || isLoading}
                sx={{ height: 48, borderRadius: 2 }}
              >
                {isPaused ? "Retomar" : "Pausar"}
              </Button>
            </Box>

            <Box sx={{ flex: "1 1 160px" }}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="error"
                startIcon={<RestartAltRounded />}
                onClick={handleReset}
                disabled={isLoading}
                sx={{ height: 48, borderRadius: 2 }}
              >
                Parar
              </Button>
            </Box>

            <Box sx={{ flex: "1 1 160px" }}>
              <Button
                fullWidth
                size="large"
                variant="outlined"
                startIcon={<RefreshRounded />}
                onClick={refreshBatchStatus}
                disabled={isLoading}
                sx={{ height: 48, borderRadius: 2 }}
              >
                Atualizar
              </Button>
            </Box>
          </Stack>

          <Divider sx={{ width: "100%", my: 2 }} />
          
          {/* Connection status */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color={isConnected ? "success.main" : "error.main"}>
              {isConnected ? "Conectado ao servidor" : connectionError || "Desconectado"}
            </Typography>
          </Box>
          
          <Button variant="text" onClick={() => navigate("/")}>
            Voltar para entrada
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}