import * as React from "react";
import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import NumbersIcon from "@mui/icons-material/Numbers";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import type { ProductionEntryForm, Shift } from "../../types/production";
import { useNavigate } from "react-router-dom";

const PRODUCT_OPTIONS = [
  "Biscoito de Mandioca Doce",
  "Biscoito de Mandioca com Queijo",
  "Biscoito de Tapioca",
  "Biscoito de Milho",
];

export default function ProductionEntry() {
  const navigate = useNavigate();

  const [product, setProduct] = React.useState<string>("");
  const [shift, setShift] = React.useState<Shift>(1);
  const [date, setDate] = React.useState<Dayjs | null>(dayjs());

  const isValid = product.trim().length > 0 && !!date && [1, 2, 3].includes(shift);

  const handleSubmit = () => {
    if (!isValid || !date) return;

    const payload: ProductionEntryForm = {
      product,
      shift,
      date: date.startOf("day").format("DD-MM-YYYY"),
    };

    // convert shift to string (fix TS error)
    const params = new URLSearchParams({
      product: payload.product,
      shift: String(payload.shift),
      date: payload.date,
    }).toString();

    navigate(`/production/session?${params}`, { state: payload });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          minHeight: "calc(100vh - 120px)",
        }}
      >
        <Paper
          sx={{
            width: "100%",
            maxWidth: 680,
            p: { xs: 3, md: 4 },
            borderRadius: 4,
          }}
        >
          <Stack spacing={3}>
            <Typography variant="h3" textAlign="center">
              Entrada de Produção
            </Typography>

            {/* Product */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                PRODUTO
              </Typography>
              <TextField
                placeholder="Digite ou escolha um produto"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Inventory2OutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                helperText="Exemplo: Biscoito de Mandioca Doce"
              />
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
                {PRODUCT_OPTIONS.map((p) => (
                  <Button key={p} size="small" variant="outlined" onClick={() => setProduct(p)}>
                    {p}
                  </Button>
                ))}
              </Stack>
            </Box>

            {/* Shift */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                TURNO
              </Typography>
              <TextField
                select
                value={shift}
                onChange={(e) => setShift(Number(e.target.value) as Shift)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NumbersIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              >
                {[1, 2, 3].map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Date */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                DATA
              </Typography>
              <DatePicker
                value={date}
                onChange={(v) => setDate(v)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
            </Box>

            {/* Action */}
            <Button
              onClick={handleSubmit}
              disabled={!isValid}
              size="large"
              variant="contained"
              sx={{ height: 52, borderRadius: 999 }}
            >
              Inicializar
            </Button>
          </Stack>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
