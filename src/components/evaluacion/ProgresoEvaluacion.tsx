'use client';

import { Box, Typography, Paper, Grid } from '@mui/material';

interface ProgresoStep {
  paso: number;
  nombre: string;
  progreso: number;
}

interface ProgresoEvaluacionProps {
  pasos: ProgresoStep[];
  titulo?: string;
}

function CircularProgressWithLabel({ value }: { value: number }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <svg
        width="60"
        height="60"
        viewBox="0 0 60 60"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx="30"
          cy="30"
          r="24"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="6"
        />
        {/* Progress circle */}
        <circle
          cx="30"
          cy="30"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeDasharray={`${2 * Math.PI * 24}`}
          strokeDashoffset={`${2 * Math.PI * 24 * (1 - value / 100)}`}
          style={{ color: '#1976d2', transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" component="div" color="text.secondary">
          {`${Math.round(value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

export default function ProgresoEvaluacion({ 
  pasos,
  titulo = "Progreso de la evaluación"
}: ProgresoEvaluacionProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {titulo}
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'center',
        mt: 2
      }}>
        {pasos.map((paso) => (
          <Box key={paso.paso} sx={{ textAlign: 'center' }}>
            <CircularProgressWithLabel value={paso.progreso} />
            <Typography sx={{ mt: 1 }}>
              {paso.nombre}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
} 