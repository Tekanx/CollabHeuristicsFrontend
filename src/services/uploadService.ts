export interface UploadResponse {
  success: boolean;
  filePath?: string;
  message?: string;
  error?: string;
  savedLocation?: string;
}

export const uploadService = {
  /**
   * Sube una imagen al servidor usando la API de Next.js
   * @param file Archivo de imagen a subir
   * @param directorio Nombre del directorio donde guardar la imagen
   * @param numeroProblema Número del problema para generar el nombre del archivo
   * @returns Promise con la respuesta del servidor
   */
  async uploadImage(file: File, directorio: string, numeroProblema: number): Promise<UploadResponse> {
    try {
      console.log('=== INICIO UPLOAD DE IMAGEN (Frontend -> Next.js API) ===');
      console.log('Archivo:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type);
      console.log('Directorio:', directorio);
      console.log('Número de problema:', numeroProblema);
      
      // Validar formato de archivo
      const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedFormats.includes(file.type)) {
        return {
          success: false,
          error: 'Formato de imagen no soportado. Solo se permiten archivos .jpg, .jpeg y .png'
        };
      }

      // Validar tamaño de archivo (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'El archivo es demasiado grande. El tamaño máximo permitido es 5MB'
        };
      }

      // Determinar extensión del archivo
      const extension = file.type === 'image/jpeg' ? 'jpeg' : 
                       file.type === 'image/jpg' ? 'jpg' : 'png';
      
      // Generar nombre del archivo en formato P-XXX.extension
      const fileName = `P-${numeroProblema.toString().padStart(3, '0')}.${extension}`;
      
      console.log('Nombre de archivo generado:', fileName);
      
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('file', file, fileName);
      formData.append('directorio', directorio);
      formData.append('fileName', fileName);

      console.log('Enviando archivo a la API de Next.js...');

      // Enviar archivo a la API de Next.js
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la respuesta del servidor');
      }

      const data = await response.json();

      console.log('Respuesta de la API:', data);
      console.log('=== FIN UPLOAD DE IMAGEN (Frontend) ===');

      return {
        success: true,
        filePath: data.filePath,
        message: data.message,
        savedLocation: data.savedLocation
      };

    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      
      return {
        success: false,
        error: error.message || 'Error al subir la imagen. Por favor, intente nuevamente.'
      };
    }
  },

  /**
   * Verifica si una imagen existe en el servidor
   * @param directorio Directorio de la imagen
   * @param fileName Nombre del archivo de imagen
   * @returns Promise<boolean> true si la imagen existe
   */
  async checkImageExists(directorio: string, fileName: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/upload?directorio=${directorio}&fileName=${fileName}`, {
        method: 'HEAD'
      });
      return response.status === 200;
    } catch (error) {
      console.warn(`Imagen no encontrada: ${directorio}/${fileName}`);
      return false;
    }
  },

  /**
   * Obtiene información del directorio de trabajo (para debugging)
   * @returns Promise con información de debugging
   */
  async getWorkingDirectoryInfo(): Promise<any> {
    try {
      // Como ahora usamos Next.js, la información es más simple
      return {
        workingDirectory: 'Next.js public directory',
        publicPath: '/public',
        message: 'Usando directorio público de Next.js'
      };
    } catch (error) {
      console.error('Error al obtener información del directorio de trabajo:', error);
      return null;
    }
  }
}; 