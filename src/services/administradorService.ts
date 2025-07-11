import axiosInstance from '../utils/axiosConfig';
import { Administrador } from '../components/interface/Administrador';
import { Evaluador } from '../components/interface/Evaluador';
import { Coordinador } from '../components/interface/Coordinador';

// Interface para crear usuarios
export interface CreateUserData {
  nombre_usuario: string;
  nombre: string;
  apellido: string;
  numero: string;
  correo: string;
  contrasena: string;
  genero: number;
  url_avatar?: string;
}

export const administradorService = {
  // Perfil del administrador (este endpoint puede no existir aún)
  async getProfile(): Promise<Administrador> {
    const response = await axiosInstance.get(`/administrador/perfil/`);
    return response.data;
  },

  async updateProfile(profile: Administrador): Promise<Administrador> {
    const response = await axiosInstance.put(`/administrador/perfil/`, profile);
    return response.data;
  },

  // Gestión de evaluadores - URLs corregidas
  async getAllEvaluadores(): Promise<Evaluador[]> {
    const response = await axiosInstance.get('/administrador/evaluadores');
    return response.data;
  },

  async getEvaluador(id: number): Promise<Evaluador> {
    const response = await axiosInstance.get(`/administrador/evaluadores/${id}`);
    return response.data;
  },

  async createEvaluador(userData: CreateUserData): Promise<Evaluador> {
    const response = await axiosInstance.post('/administrador/crear-evaluador', {
      ...userData,
      url_avatar: userData.url_avatar || null
    });
    return response.data;
  },

  async updateEvaluador(id: number, userData: Partial<CreateUserData>): Promise<Evaluador> {
    // El backend espera el objeto completo con el ID incluido
    const updateData = {
      id_evaluador: id,
      ...userData
    };
    const response = await axiosInstance.put(`/administrador/actualizar-evaluador`, updateData);
    return response.data;
  },

  async deleteEvaluador(id: number): Promise<string> {
    const response = await axiosInstance.delete(`/administrador/eliminar-evaluador/${id}`);
    return response.data;
  },

  // Gestión de coordinadores - URLs corregidas
  async getAllCoordinadores(): Promise<Coordinador[]> {
    const response = await axiosInstance.get('/administrador/coordinadores');
    return response.data;
  },

  async getCoordinador(id: number): Promise<Coordinador> {
    const response = await axiosInstance.get(`/administrador/coordinadores/${id}`);
    return response.data;
  },

  async createCoordinador(userData: CreateUserData): Promise<Coordinador> {
    const response = await axiosInstance.post('/administrador/crear-coordinador', {
      ...userData,
      url_avatar: userData.url_avatar || null
    });
    return response.data;
  },

  async updateCoordinador(id: number, userData: Partial<CreateUserData>): Promise<Coordinador> {
    // El backend espera el objeto completo con el ID incluido
    const updateData = {
      id_coordinador: id,
      ...userData
    };
    const response = await axiosInstance.put(`/administrador/actualizar-coordinador`, updateData);
    return response.data;
  },

  async deleteCoordinador(id: number): Promise<string> {
    const response = await axiosInstance.delete(`/administrador/eliminar-coordinador/${id}`);
    return response.data;
  }
};
