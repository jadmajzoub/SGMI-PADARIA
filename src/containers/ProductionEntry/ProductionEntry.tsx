import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import NumbersIcon from "@mui/icons-material/Numbers";
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
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../../services/production";
import type { ProductionEntryForm, Shift } from "../../types/production";

export default function ProductionEntry() {
  const navigate = useNavigate();

  const [product, setProduct] = React.useState<string>("");
  const [shift, setShift] = React.useState<Shift>("MANHÃ");
  const [date, setDate] = React.useState<Dayjs | null>(dayjs());
  const [bateladas, setBateladas] = React.useState<number>(1);
  const [duration, setDuration] = React.useState<number>(30);
  const [products, setProducts] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Load products from backend
  React.useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getAll();
        const productNames = response.data.map(p => p.name);
        setProducts(productNames);
      } catch (error) {
        console.error('Failed to load products:', error);
        // Fallback to empty array on error
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  const isValid = product.trim().length > 0 && !!date && bateladas > 0 && duration > 0;

  const handleSubmit = async () => {
    if (!isValid || !date) return;

    const payload: ProductionEntryForm = {
      product,
      shift,
      date: date.startOf("day").format("DD-MM-YYYY"),
      bateladas,
      duration,
    };

    try {
      setLoading(true);
      
      // Import the service dynamically to avoid auto-formatter issues
      const { simpleBatchService } = await import("../../services/production");
      
      // Call the new simplified batch creation API using the proper service
      const result = await simpleBatchService.create(payload);
      
      if (result.success) {
        alert(`Lote criado com sucesso!\nProduto: ${payload.product}\nTurno: ${payload.shift}\nBateladas: ${payload.bateladas}\nDuração: ${payload.duration} minutos`);
        
        // Reset form
        setProduct("");
        setShift("MANHÃ");
        setBateladas(1);
        setDuration(30);
        setDate(dayjs());
      } else {
        throw new Error(result.message || 'Erro ao criar lote');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      alert(`Erro ao criar lote: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
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
                {loading ? (
                  <Typography variant="body2" color="text.secondary">
                    Carregando produtos...
                  </Typography>
                ) : (
                  products.map((p) => (
                    <Button key={p} size="small" variant="outlined" onClick={() => setProduct(p)}>
                      {p}
                    </Button>
                  ))
                )}
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
                onChange={(e) => setShift(e.target.value as Shift)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NumbersIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="MANHÃ">MANHÃ</MenuItem>
                <MenuItem value="TARDE">TARDE</MenuItem>
                <MenuItem value="NOITE">NOITE</MenuItem>
              </TextField>
            </Box>

            {/* Bateladas */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                BATELADAS
              </Typography>
              <TextField
                type="number"
                value={bateladas}
                onChange={(e) => setBateladas(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NumbersIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                helperText="Número de bateladas produzidas"
              />
            </Box>

            {/* Duration */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                DURAÇÃO (MINUTOS)
              </Typography>
              <TextField
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                helperText="Tempo total de produção em minutos"
              />
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
