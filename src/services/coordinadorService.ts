import { Coordinador } from "@/components/interface/Coordinador";
import axiosInstance from "../utils/axiosConfig";
import { Evaluacion } from "@/components/interface/Evaluacion";

// Type for creating a new evaluation from form data
export interface CreateEvaluacionData {
    evaluacion_identificador: string;
    nombre_evaluacion: string;
    descripcion?: string;
    directorio: string;
    fecha_inicio: string;
}

export const coordinadorService = {

    async getProfile(): Promise<Coordinador> {
        const response = await axiosInstance.get(`/coordinadores/perfil/`);
        return response.data;
    },
    async updateProfile(profile: Coordinador): Promise<Coordinador> {
        const response = await axiosInstance.put(`/coordinadores/perfil/`, profile);
        return response.data;
    },
    async getCoordinadores(): Promise<Coordinador[]> {
        const response = await axiosInstance.get("/coordinadores");
        return response.data;
    },
    async getCoordinador(id: number): Promise<Coordinador> {
        const response = await axiosInstance.get(`/coordinadores/${id}`);
        return response.data;
    },
    async createEvaluacion(evaluacionData: CreateEvaluacionData): Promise<Evaluacion> {
        // Prepare the data with default values for required backend fields
        const dataToSend = {
            ...evaluacionData,
            id_heuristica: 1, // Default heuristic ID
            descripcion: evaluacionData.descripcion || '' // Ensure description is never null
        };
        
        const response = await axiosInstance.post("/coordinadores/evaluacion", dataToSend);
        return response.data;
    }
}