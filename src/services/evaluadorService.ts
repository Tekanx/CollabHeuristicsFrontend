import axiosInstance from '../utils/axiosConfig';

import { Evaluador } from '../components/interface/Evaluador';

export const evaluadorService = {
    async getProfile(): Promise<Evaluador> {
        const response = await axiosInstance.get(`/evaluadores/perfil/`);
        return response.data;
    },
    async updateProfile(profile: Evaluador): Promise<Evaluador> {
        const response = await axiosInstance.put(`/evaluadores/perfil/`, profile);
        return response.data;
    },
    async getEvaluador(id: number): Promise<Evaluador> {
        const response = await axiosInstance.get(`/evaluadores/${id}/`);
        return response.data;
    },
    async getEvaluadorByNombreUsuario(nombre: string): Promise<Evaluador> {
        const response = await axiosInstance.get(`/evaluadores/nombre_usuario/`);
        return response.data;
    },
    async getEvaluadorAutenticado(): Promise<Evaluador> {
        const response = await axiosInstance.get('/evaluadores/usuario_autenticado/');
        return response.data;
    },
    async getAllEvaluadores(): Promise<Evaluador[]> {
        const response = await axiosInstance.get('/evaluadores/');
        return response.data;
    },
    async getEvaluadoresByEvaluacion(idEvaluacion: number): Promise<Evaluador[]> {
        const response = await axiosInstance.get(`/evaluaciones/${idEvaluacion}/evaluadores/`);
        return response.data;
    },
    async agregarEvaluadorAEvaluacion(idEvaluador: number, idEvaluacion: number): Promise<string> {
        const response = await axiosInstance.post(`/evaluaciones/${idEvaluacion}/evaluadores/`, {
            id_evaluador: idEvaluador
        });
        return response.data;
    },
    async updateEvaluador(evaluador: Evaluador, idEvaluador: number): Promise<string> {
        const response = await axiosInstance.put(`/evaluadores/${idEvaluador}`, evaluador);
        return response.data;
    },
    async eliminarEvaluadorDeEvaluacion(idEvaluador: number, idEvaluacion: number): Promise<string> {
        const response = await axiosInstance.delete(`/evaluaciones/${idEvaluacion}/evaluadores/${idEvaluador}/`);
        return response.data;
    },
    async getCantidadProblemasDeEvaluacion(idEvaluador: number, idEvaluacion: number): Promise<number> {
        const response = await axiosInstance.get(`/evaluadores/${idEvaluador}/evaluaciones/${idEvaluacion}/cantidad_problemas/`);
        return response.data;
    },
    async iniciarPuntuacion(idEvaluador: number, idProblema: number): Promise<string> {
        const response = await axiosInstance.post(`/evaluadores/${idEvaluador}/problema/${idProblema}/iniciar-puntuacion/`);
        return response.data;
    }
}

