'use client';

import { Box, Typography, Paper, Grid } from '@mui/material';
import { Schedule as ScheduleIcon } from '@mui/icons-material';

interface DetallesEvaluacionProps {
  nombre_evaluacion: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_termino: string | null;
  evaluacion_identificador: string;
}

export default function DetallesEvaluacion({
  nombre_evaluacion,
  descripcion,
  fecha_inicio,
  fecha_termino,
  evaluacion_identificador,
}: DetallesEvaluacionProps) {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            {nombre_evaluacion}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1" paragraph>
            {descripcion}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon fontSize="small" />
            <Typography variant="subtitle1">
              {`${new Date(fecha_inicio).toLocaleDateString()} - `}
              {fecha_termino ? new Date(fecha_termino).toLocaleDateString() : 'A la fecha'}
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary">
            Identificador: {evaluacion_identificador}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
} 