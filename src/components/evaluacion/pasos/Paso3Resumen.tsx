import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogActions } from '@mui/material';

interface Paso3ResumenProps {
  mostrarFinalizarPaso3?: boolean;
  onFinalizarPaso3?: () => void;
}

function Paso3Resumen({ mostrarFinalizarPaso3 = false, onFinalizarPaso3 }: Paso3ResumenProps) {
  const [openConfirm, setOpenConfirm] = useState(false);

  const handleFinalizar = () => setOpenConfirm(true);
  const handleConfirm = () => {
    setOpenConfirm(false);
    if (onFinalizarPaso3) onFinalizarPaso3();
  };
  const handleCancel = () => setOpenConfirm(false);

  return (
    <Box>
      Paso3Resumen
      {mostrarFinalizarPaso3 && (
        <Button variant="contained" color="secondary" sx={{ ml: 2 }} onClick={handleFinalizar}>
          Finalizar Paso 3
        </Button>
      )}
      <Dialog open={openConfirm} onClose={handleCancel}>
        <DialogTitle>¿Está seguro de que quiere terminar la fase 3?</DialogTitle>
        <DialogActions>
          <Button onClick={handleCancel}>Cancelar</Button>
          <Button onClick={handleConfirm} variant="contained" color="primary">Finalizar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Paso3Resumen;