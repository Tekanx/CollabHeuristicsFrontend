'use client';

import { useRef, useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { BarChart } from '@mui/x-charts';

interface DatosHeuristica {
  id: number;
  nombre: string;
  valor: number;
  color: string;
}

interface GraficoHeuristicasProps {
  datos: DatosHeuristica[];
  titulo?: string;
}

export default function GraficoHeuristicas({ 
  datos,
  titulo = "Problemas encontrados por heurística"
}: GraficoHeuristicasProps) {
  const [openSettings, setOpenSettings] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#1976d2');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);

  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        const containerWidth = chartContainerRef.current.offsetWidth;
        setChartWidth(Math.max(400, containerWidth - 40));
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    window.addEventListener('resize', updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  const handleSettingsOpen = () => setOpenSettings(true);
  const handleSettingsClose = () => setOpenSettings(false);
  const handleColorChange = (color: string) => setSelectedColor(color);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {titulo}
        </Typography>
        <IconButton onClick={handleSettingsOpen} color="primary">
          <SettingsIcon />
        </IconButton>
      </Box>
      <Box
        ref={chartContainerRef}
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: '400px',
          width: '100%',
          overflow: 'auto'
        }}
      >
        <BarChart
          xAxis={[{
            scaleType: 'band',
            data: datos.map(item => `H${item.id}`),
            label: 'Heurísticas',
            labelStyle: { display: 'none' },
            tickLabelStyle: {
              fontSize: 12,
              angle: 0
            }
          }]}
          series={[{
            type: 'bar',
            data: datos.map(item => item.valor),
            label: 'Cantidad de problemas',
            color: selectedColor
          }]}
          height={180}
          width={chartWidth}
          margin={{ top: 20, right: 20, bottom: 30, left: 50 }}
          slotProps={{
            legend: {
              hidden: true
            }
          }}
        />
      </Box>

      {/* Settings Dialog */}
      <Dialog open={openSettings} onClose={handleSettingsClose} maxWidth="sm" fullWidth>
        <DialogTitle>Configuración de colores</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Color de las barras</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => handleColorChange(e.target.value)}
                style={{ width: '50px', height: '30px' }}
              />
              <Typography variant="body2" color="text.secondary">
                {selectedColor}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSettingsClose}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
} 