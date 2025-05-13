import { PrincipioHeuristica } from '@/components/interface/PrincipioHeuristica';
import axiosInstance from '../utils/axiosConfig';
import { Problema } from '@/components/interface/Problema';


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

    async createProblema(idEvaluacion: number, problema: Problema): Promise<Problema> {
        const response = await axiosInstance.post(`/problemas/${idEvaluacion}/problema`, problema);
        return response.data;
    },

    async consolidarProblemas(problemasAConsolidar: Problema[]): Promise<Problema[]> {
        const response = await axiosInstance.post(`/problemas/consolidar`, problemasAConsolidar);
        return response.data;
    },
    
    async updateProblema(id_problema: number, problema: Problema): Promise<Problema> {
        const response = await axiosInstance.put(`/problemas/${id_problema}`, problema);
        return response.data;
    },

    async deleteProblema(id_problema: number): Promise<void> {
        await axiosInstance.delete(`/problemas/${id_problema}`);
    },
}

