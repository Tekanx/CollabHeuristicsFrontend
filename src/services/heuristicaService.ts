import axiosInstance from '../utils/axiosConfig';
import { Heuristica } from '@/components/interface/Heuristica';
import { PrincipioHeuristica } from '@/components/interface/PrincipioHeuristica';
//const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8085/api';

export const heuristicService = {
  async getHeuristica(id: number): Promise<Heuristica> {
    const response = await axiosInstance.get(`/heuristicas/${id}`);
    return response.data;
  },

  async getPrincipiosHeuristicos(id: number): Promise<PrincipioHeuristica[]> {
    const response = await axiosInstance.get(`/heuristicas/${id}/principios`);
    return response.data;
  },

  async getAllHeuristicas(): Promise<Heuristica[]> {
    const response = await axiosInstance.get(`/heuristicas`);
    return response.data;
  }
}; 