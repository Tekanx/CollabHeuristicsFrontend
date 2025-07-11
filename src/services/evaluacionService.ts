import { Evaluador } from '@/components/interface/Evaluador';
import axiosInstance from '../utils/axiosConfig';

import { Evaluacion } from '@/components/interface/Evaluacion';

export const evaluacionService = {
    async getEvaluacion(id: number): Promise<Evaluacion> {
        const response = await axiosInstance.get(`/evaluaciones/${id}`);
        return response.data;
    },
    async getEvaluaciones(): Promise<Evaluacion[]> {
        const response = await axiosInstance.get('/evaluaciones');
        return response.data;
    },      
    async getEvaluacionesByEvaluador(id: number): Promise<Evaluacion[]> {
        const response = await axiosInstance.get(`/evaluaciones/evaluador/${id}`);
        return response.data;
    },
    async getEvaluadoresByEvaluacion(id: number): Promise<Evaluador[]> {
        const response = await axiosInstance.get(`/evaluaciones/${id}/evaluadores`);
        return response.data;
    },
    async getEvaluacionByProblema(id: number) {
        const response = await axiosInstance.get(`/evaluaciones/problema/${id}`);
        return response.data;
    },
    async evaluarProblema(problemaId: number, data: { probabilidad: number, severidad: number }) {
        const response = await axiosInstance.put(`/problemas/${problemaId}/puntuacion`, data);
        return response.data;
    },
    async getEstadisticasEvaluacion(evaluacionId: number) {
        const response = await axiosInstance.get(`/evaluaciones/${evaluacionId}/estadisticas`);
        return response.data;
    },
    async getProgresoEvaluador(evaluacionId: number, evaluadorId: number) {
        try {
            console.log('🌐 Llamando API getProgresoEvaluador...');
            console.log('📋 Parámetros:');
            console.log('  - evaluacionId:', evaluacionId);
            console.log('  - evaluadorId:', evaluadorId);
            
            // URL según el backend: /{id_evaluacion}/evaluador/{id_evaluador}/progreso
            const url = `/evaluadores/evaluaciones/${evaluacionId}/evaluador/${evaluadorId}/progreso`;
            console.log('📍 URL corregida según backend:', url);
            
            const response = await axiosInstance.get(url);
            console.log('✅ Progreso obtenido:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error en getProgresoEvaluador:', error);
            throw error;
        }
    },
    async setProgresoEvaluador(evaluacionId: number, evaluadorId: number, progreso: number) {
        console.log('🌐 Llamando API setProgresoEvaluador...');
        console.log('📋 Parámetros ordenados correctamente:');
        console.log('  - evaluacionId:', evaluacionId);
        console.log('  - evaluadorId:', evaluadorId);
        console.log('  - progreso:', progreso);
        
        // URL según el backend: /evaluadores/evaluaciones/{id_evaluacion}/evaluador/{id_evaluador}/progreso
        const url = `/evaluadores/evaluaciones/${evaluacionId}/evaluador/${evaluadorId}/progreso`;
        console.log('📍 URL corregida según backend:', url);
        console.log('📦 Body (directo):', progreso);
        console.log('🔍 Tipo del progreso:', typeof progreso);
        
        // Agregar logs adicionales para depurar
        console.log('🔍 Verificando parámetros antes de enviar:');
        console.log('  - URL completa:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8085/api'}${url}`);
        console.log('  - Method: PUT');
        console.log('  - Headers: Content-Type: application/json');
        console.log('  - Body:', JSON.stringify(progreso));
        
        try {
            const response = await axiosInstance.put(
                url, 
                progreso,
                {
                    headers: {
                            'Content-Type': 'application/json'
                    }
                }
                );
                console.log('✅ Respuesta exitosa con PUT:', response.data);
                console.log('🔍 Tipo de respuesta:', typeof response.data);
                console.log('🔍 Status de respuesta:', response.status);
                
                // Verificar si la respuesta indica éxito en la actualización
                if (response.data === 0) {
                    console.warn('⚠️ WARNING: La respuesta es 0, lo que podría indicar que no se actualizó ninguna fila');
                    console.warn('⚠️ Esto puede significar que:');
                    console.warn('  1. No existe un registro en detalle_evaluacion para esta combinación');
                    console.warn('  2. Los parámetros no coinciden con ningún registro');
                    console.warn('  3. El evaluador no está asignado a esta evaluación');
                }
                
            return response.data;
        } catch (putError: any) {
            console.error('❌ Falló con PUT:', putError);
            console.error('❌ Error details:', {
                message: putError.message,
                status: putError.response?.status,
                statusText: putError.response?.statusText,
                data: putError.response?.data,
                url: url
            });
            throw putError;
        }
    },
    async finalizarEvaluacion(evaluacionId: number) {
        try {
            console.log('🌐 Llamando API finalizarEvaluacion...');
            console.log('📋 Parámetros:');
            console.log('  - evaluacionId:', evaluacionId);
            
            // Enviar la fecha actual para asegurar que sea correcta
            const fechaActual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
            console.log('📅 Fecha de término enviada:', fechaActual);
            
            const url = `/evaluaciones/${evaluacionId}/finalizar-evaluacion`;
            console.log('📍 URL:', url);
            
            const response = await axiosInstance.post(url, {
                fecha_termino: fechaActual
            });
            console.log('✅ Evaluación finalizada exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error al finalizar evaluación:', error);
            throw error;
        }
    },
    async actualizarEvaluacion(id: number, data: { nombre_evaluacion: string, descripcion: string, evaluacion_identificador: string }) {
        try {
            console.log('🌐 Llamando API actualizarEvaluacion...');
            console.log('📋 Parámetros:');
            console.log('  - id:', id);
            console.log('  - data:', data);
            
            const url = `/evaluaciones/${id}/evaluacion`;
            console.log('📍 URL:', url);
            
            const response = await axiosInstance.post(url, data);
            console.log('✅ Evaluación actualizada exitosamente:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error al actualizar evaluación:', error);
            throw error;
        }
    },
    async eliminarEvaluacion(id: number) {
        try {
            const response = await axiosInstance.delete(`/evaluaciones/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Error al eliminar evaluación:', error);
            throw error;
        }
    }
}