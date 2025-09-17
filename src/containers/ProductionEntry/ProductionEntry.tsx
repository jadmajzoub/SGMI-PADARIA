import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import NumbersIcon from "@mui/icons-material/Numbers";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Skeleton,
} from "@mui/material";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { productService } from "../../services/production";
import type { Shift } from "../../types/production";

export default function ProductionEntry() {
  const navigate = useNavigate();

  const [product, setProduct] = React.useState<string>("");
  const [shift, setShift] = React.useState<Shift>("MANHÃ");
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

  const isValid = product.trim().length > 0;

  const handleStartSession = () => {
    if (!isValid) return;

    // Navigate to production session with current date
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');

    // Convert shift to number for URL compatibility
    const shiftNumber = shift === 'MANHÃ' ? '1' : shift === 'TARDE' ? '2' : '3';

    navigate(`/production/session?product=${encodeURIComponent(product)}&shift=${shiftNumber}&date=${formattedDate}`);
  };

  return (
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
            Iniciar Sessão de Produção
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
                  <>
                    <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: 20 }} />
                    <Skeleton variant="rectangular" width={120} height={32} sx={{ borderRadius: 20 }} />
                    <Skeleton variant="rectangular" width={90} height={32} sx={{ borderRadius: 20 }} />
                  </>
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

            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ fontStyle: 'italic' }}>
              A data, bateladas e duração serão rastreadas automaticamente na sessão de produção em tempo real.
            </Typography>

            {/* Action */}
            <Button
              onClick={handleStartSession}
              disabled={!isValid || loading}
              size="large"
              variant="contained"
              startIcon={<PlayArrowRounded />}
              sx={{ height: 52, borderRadius: 999 }}
            >
              {loading ? "Carregando..." : "Iniciar Sessão"}
            </Button>
          </Stack>
        </Paper>
      </Box>
  );
}
