'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { uploadService } from '@/services/uploadService';
import { formatImagePath, debugImagePath, imageExists } from '@/utils/imageUtils';

export default function ImageDebugComponent() {
  const [testImagePath, setTestImagePath] = useState('/Crunch/P-001.png');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleDebugImagePath = async () => {
    setLoading(true);
    try {
      await debugImagePath(testImagePath);
      
      // Obtener información del directorio de trabajo
      const workingDirInfo = await uploadService.getWorkingDirectoryInfo();
      
      setDebugInfo({
        originalPath: testImagePath,
        formattedPath: formatImagePath(testImagePath),
        workingDirInfo: workingDirInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en debug:', error);
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestNextJSAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/upload', { method: 'HEAD' });
      
      setDebugInfo({
        nextJSAPI: response.ok ? 'ÉXITO' : 'FALLA',
        statusCode: response.status,
        message: response.ok ? 'API de Next.js funcionando correctamente' : 'API de Next.js no responde',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDebugInfo({
        nextJSAPI: 'ERROR',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestImageAccess = async () => {
    setLoading(true);
    try {
      const testPaths = [
        '/Crunch/P-001.png',
        'Crunch/P-001.png',
        '/SerAyudante/P-001.png',
        '/SerPucv/P-001.png'
      ];

      const results: Record<string, string> = {};
      
      for (const path of testPaths) {
        try {
          console.log(`Probando acceso a: ${path}`);
          const formattedPath = formatImagePath(path);
          console.log(`Ruta formateada: ${formattedPath}`);
          
          const exists = await imageExists(formattedPath);
          results[path] = exists ? 'ACCESIBLE' : 'NO ACCESIBLE';
          console.log(`Resultado para ${path}: ${results[path]}`);
        } catch (error) {
          results[path] = `ERROR: ${error instanceof Error ? error.message : 'Error desconocido'}`;
          console.error(`Error para ${path}:`, error);
        }
      }

      setDebugInfo({
        imageAccessResults: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error probando acceso a imágenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestDirectoryStructure = async () => {
    setLoading(true);
    try {
      const directories = ['Crunch', 'SerAyudante', 'SerPucv', 'UberEats'];
      const results: Record<string, string> = {};
      
      for (const dir of directories) {
        try {
          const response = await fetch(`/${dir}/test.png`, { method: 'HEAD' });
          results[dir] = response.status === 404 ? 'DIRECTORIO EXISTE (404 esperado)' : 
                        response.status === 200 ? 'ARCHIVO DE PRUEBA EXISTE' : 
                        `ESTADO: ${response.status}`;
        } catch (error) {
          results[dir] = 'DIRECTORIO POSIBLEMENTE NO EXISTE';
        }
      }

      setDebugInfo({
        directoryStructure: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error probando estructura de directorios:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        🔧 Debug de Imágenes (Next.js)
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Ruta de imagen para probar"
          value={testImagePath}
          onChange={(e) => setTestImagePath(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            onClick={handleDebugImagePath}
            disabled={loading}
          >
            Debug Ruta
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={handleTestNextJSAPI}
            disabled={loading}
          >
            Test Next.js API
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={handleTestImageAccess}
            disabled={loading}
          >
            Test Acceso Imagen
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={handleTestDirectoryStructure}
            disabled={loading}
          >
            Test Directorios
          </Button>
        </Box>
        
        {loading && <CircularProgress size={24} />}
      </Box>

      {debugInfo && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Información de Debug:</Typography>
          <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Imagen de prueba:
        </Typography>
        <img
          src={formatImagePath(testImagePath)}
          alt="Imagen de prueba"
          style={{
            maxWidth: '200px',
            maxHeight: '200px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          onError={(e) => {
            console.error('Error cargando imagen de prueba');
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
          onLoad={() => {
            console.log('Imagen de prueba cargada exitosamente');
          }}
        />
      </Box>
    </Paper>
  );
} 