export interface Evaluacion {
    id_evaluacion: number;
    evaluacion_identificador: string;
    nombre_evaluacion: string;
    descripcion: string;
    fecha_inicio: Date;
    fecha_fin: Date;
    id_coordinador: number;
    id_heuristica: number;
}
