import { PrincipioHeuristica } from '@/components/interface/PrincipioHeuristica';
import axiosInstance from '../utils/axiosConfig';
import { Problema } from '@/components/interface/Problema';
import { Historico_problema } from '@/components/interface/Historico_problema';
import { Puntuacion_problema } from '@/components/interface/Puntuacion_problema';

// Interfaz para el formato esperado por el backend
interface ProblemaBackend {
    numero_problema: number;
    nombre_problema: string;
    descripcion_problema: string;
    fk_heuristica_incumplida: number;
    ejemplo_ocurrencia: string;
    url_imagen: string;
}

export const problemaService = {
    async getProblema(id: number): Promise<Problema> {
        const response = await axiosInstance.get(`/problemas/${id}`);
        return response.data;
    },

    async getProblemasByEvaluacion(idEvaluacion: number): Promise<Problema[]> {
        const response = await axiosInstance.get(`/problemas/evaluacion/${idEvaluacion}`);
        return response.data;
    },
    
    async getProblemasofEvaluador(id_evaluador: number): Promise<Problema[]> {
        const response = await axiosInstance.get(`/problemas/evaluador/${id_evaluador}`);
        return response.data;
    },

    async getCantidadPrincipiosPorProblema(id_evaluacion: number): Promise<PrincipioHeuristica[]> {
        const response = await axiosInstance.get(`/problemas/${id_evaluacion}/principios/problemas`);
        return response.data;
    },

    async getProblemasPendientes(idEvaluacion: number): Promise<Problema[]> {
        const response = await axiosInstance.get(`/problemas/${idEvaluacion}/pendientes`);
        return response.data;
    },
    
    async getProblemasEvaluados(idEvaluacion: number): Promise<Problema[]> {
        const response = await axiosInstance.get(`/problemas/${idEvaluacion}/evaluados`);
        return response.data;
    },
    
    async getCantidadProblemasPendientes(idEvaluacion: number): Promise<number> {
        const response = await axiosInstance.get(`/problemas/${idEvaluacion}/cantidad-pendientes`);
        return response.data;
    },
    
    async getCantidadProblemasEvaluados(idEvaluacion: number): Promise<number> {
        const response = await axiosInstance.get(`/problemas/${idEvaluacion}/cantidad-evaluados`);
        return response.data;
    },

    async getPuntuacionProblema(id: number): Promise<Puntuacion_problema> {
        const response = await axiosInstance.get(`/problemas/${id}/puntuacion`);
        return response.data;
    },
    
    async getHistoricoProblema(id_problema: number): Promise<Historico_problema[]> {
        const response = await axiosInstance.get(`/problemas/${id_problema}/historico`);
        return response.data;
    },

    async createProblema(idEvaluacion: number, problema: ProblemaBackend): Promise<Problema> {
        const response = await axiosInstance.post(`/problemas/${idEvaluacion}/problema`, problema);
        return response.data;
    },


    async consolidarProblemas(problemasAConsolidar: Problema[]): Promise<Problema[]> {
        const response = await axiosInstance.post(`/problemas/consolidar`, problemasAConsolidar);
        return response.data;
    },
    
    async updateProblema(id_problema: number, problema: Problema, historico: Historico_problema): Promise<Problema> {
        const response = await axiosInstance.put(`/problemas/${id_problema}`, { problema, historico });
        return response.data;
    },

    async deleteProblema(id_problema: number): Promise<void> {
        await axiosInstance.delete(`/problemas/${id_problema}`);
    },

    // Obtener promedios de puntuaciones por problema
    async getPromediosPuntuaciones(evaluacionId: number): Promise<any[]> {
        const response = await axiosInstance.get(`/puntuaciones/evaluacion/${evaluacionId}/promedios`);
        return response.data;
    },

    // Obtener puntuaciones de todos los evaluadores para un problema específico
    async getPuntuacionesProblema(problemaId: number): Promise<any[]> {
        const response = await axiosInstance.get(`/problemas/${problemaId}/puntuaciones`);
        return response.data;
    },

    // Obtener problemas con puntuaciones de todos los evaluadores
    async getProblemasConPuntuaciones(evaluacionId: number): Promise<any[]> {
        const response = await axiosInstance.get(`/problemas/evaluacion/${evaluacionId}/con-puntuaciones`);
        return response.data;
    }
}

