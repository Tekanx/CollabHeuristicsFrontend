export interface Historico_problema {
    id_historico_problema?: number;
    id_problema: number;
    id_evaluador?: number;
    id_coordinador?: number;
    detalle_cambio: string;
    fecha_cambio: Date | string;
    nombre_autor?: string; // Nombre completo del autor del cambio
}
