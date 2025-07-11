export interface Problema {
  id: number;
  numeroProblema: number;
  nombreProblema: string;
  descripcion: string;
  heuristicaIncumplida: string;
  ejemploOcurrencia: string;
  imagen: string;
  autor?: string;
  id_evaluacion?: number;
  id_evaluador?: number;
  identificador?: string;
  // Campos para evaluación
  evaluado?: boolean;
  probabilidad?: number | null;
  severidad?: number | null;
} 