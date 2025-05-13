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
    async getEvaluadoresByEvaluacion(id: number) {
        const response = await axiosInstance.get(`/evaluaciones/${id}/evaluadores`);
        return response.data;
    }
}