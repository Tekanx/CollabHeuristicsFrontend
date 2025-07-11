export interface ProblemaConPuntuaciones {
  id: number;
  numeroProblema: number;
  identificador: string;
  nombreProblema: string;
  descripcion: string;
  heuristicaIncumplida: string;
  ejemploOcurrencia: string;
  imagen: string;
  puntuaciones: PuntuacionEvaluador[];
  promedioFrecuencia: number;
  promedioSeveridad: number;
  promedioCriticidad: number;
}

export interface PuntuacionEvaluador {
  id_evaluador: number;
  numero_evaluador: number;
  nombre_evaluador: string;
  probabilidad: number;
  severidad: number;
  criticidad: number;
}

export interface HeuristicaResumen {
  id: number;
  nombre: string;
  cantidadProblemas: number;
  color: string;
}

export interface ResumenEvaluacion {
  problemas: ProblemaConPuntuaciones[];
  heuristicas: HeuristicaResumen[];
  evaluadores: { id: number; nombre: string; apellido: string }[];
} 