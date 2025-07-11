export interface Evaluacion {
    id_evaluacion: number;
    evaluacion_identificador: string;
    nombre_evaluacion: string;
    descripcion: string;
    fecha_inicio: string;
    fecha_fin: string;
    id_coordinador: number;
    id_heuristica: number;
    directorio: string;
}
