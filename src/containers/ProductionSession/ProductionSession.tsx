import * as React from "react";
import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import PauseRounded from "@mui/icons-material/PauseRounded";
import RestartAltRounded from "@mui/icons-material/RestartAltRounded";
import AddCircleOutlineRounded from "@mui/icons-material/AddCircleOutlineRounded";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { formatHMS } from "../../utils/format";
import type { Shift } from "../../types/production";

type SessionState = {
  product: string;
  shift: Shift;
  date: string; // yyyy-mm-dd
};

const STORAGE_PREFIX = "sgmi:session";
const storageKey = ({ product, shift, date }: SessionState) =>
  `${STORAGE_PREFIX}:${product}:${shift}:${date}`;

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

  const [seconds, setSeconds] = React.useState(0);
  const [batches, setBatches] = React.useState(0);
  const [running, setRunning] = React.useState(false);

  // Load persisted
  React.useEffect(() => {
    if (!state) return;
    const raw = localStorage.getItem(storageKey(state));
    if (raw) {
      try {
        const saved = JSON.parse(raw) as { seconds: number; batches: number; running: boolean };
        setSeconds(saved.seconds ?? 0);
        setBatches(saved.batches ?? 0);
        setRunning(saved.running ?? false);
      } catch {}
    }
  }, [state]);

  // Persist on change
  React.useEffect(() => {
    if (!state) return;
    localStorage.setItem(storageKey(state), JSON.stringify({ seconds, batches, running }));
  }, [state, seconds, batches, running]);

  // Timer loop
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!state) return null;

  const title = `${state.product} — Shift ${state.shift}`;
  const displayDate = new Date(state.date + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const handleStart = () => setRunning(true);
  const handlePause = () => setRunning(false);
  const handleReset = () => {
    setRunning(false);
    setSeconds(0);
    setBatches(0);
  };
  const handleBatch = () => setBatches((n) => n + 1);

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
          </Box>

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
                  Batches
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {batches}
                </Typography>
              </Box>

              <Box sx={{ display: { xs: "block", sm: "none" }, height: 1, borderTop: "1px solid", borderColor: "divider", my: 1 }} />

              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  Time
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {formatHMS(seconds)}
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
                disabled={running}
                sx={{ height: 48, borderRadius: 2 }}
              >
                Start
              </Button>
            </Box>

            <Box sx={{ flex: "1 1 160px" }}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="secondary"
                startIcon={<AddCircleOutlineRounded />}
                onClick={handleBatch}
                sx={{ height: 48, borderRadius: 2 }}
              >
                Batch
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
                disabled={!running}
                sx={{ height: 48, borderRadius: 2 }}
              >
                Pause
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
                sx={{ height: 48, borderRadius: 2 }}
              >
                Reset
              </Button>
            </Box>
          </Stack>

          <Divider sx={{ width: "100%", my: 2 }} />
          <Button variant="text" onClick={() => navigate("/")}>
            Back to entry
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}