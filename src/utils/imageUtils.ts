/**
 * Utility functions for handling image paths and formatting
 * Simplificado para usar el directorio público de Next.js
 */

/**
 * Formats an image path to ensure it works properly with Next.js public directory
 * @param imagePath The original image path
 * @returns Properly formatted image path for Next.js
 */
export const formatImagePath = (imagePath: string | undefined | null): string => {
  if (!imagePath) return '/placeholder.png';
  
  console.log('Original image path:', imagePath);
  
  // Limpiar la ruta de la imagen
  let cleanPath = imagePath;
  
  // Si es una URL completa, devolverla tal cual
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }
  
  // Si ya comienza con /, es una ruta válida para Next.js
  if (cleanPath.startsWith('/')) {
    console.log('Ruta ya formateada para Next.js:', cleanPath);
    return cleanPath;
  }
  
  // Si no comienza con /, agregar la barra inicial
  const formattedPath = `/${cleanPath}`;
  console.log('Ruta formateada para Next.js:', formattedPath);
  return formattedPath;
};

/**
 * Attempts to find an image with multiple extensions if the original fails
 * @param basePath The base path without extension
 * @param extensions Array of extensions to try
 * @returns Promise with the first working image path or null
 */
export const findImageWithExtensions = async (basePath: string, extensions: string[] = ['.png', '.jpg', '.jpeg']): Promise<string | null> => {
  for (const ext of extensions) {
    const fullPath = basePath + ext;
    try {
      const response = await fetch(fullPath, { method: 'HEAD' });
      if (response.ok) {
        console.log('Imagen encontrada con extensión:', fullPath);
        return fullPath;
      }
    } catch (error) {
      // Continue to next extension
    }
  }
  console.warn('No se encontró imagen con ninguna extensión para:', basePath);
  return null;
};

/**
 * Checks if an image file exists and is accessible
 * @param imagePath The path to check
 * @returns True if image exists and is accessible
 */
export const imageExists = async (imagePath: string): Promise<boolean> => {
  try {
    const response = await fetch(imagePath, { method: 'HEAD' });
    const exists = response.ok;
    console.log(`Verificación de imagen ${imagePath}:`, exists ? 'EXISTE' : 'NO EXISTE');
    return exists;
  } catch (error) {
    console.warn(`Error al verificar imagen ${imagePath}:`, error);
    return false;
  }
};

/**
 * Gets the image type based on file extension
 * @param imagePath The image path
 * @returns The MIME type or undefined if not recognized
 */
export const getImageType = (imagePath: string): string | undefined => {
  if (!imagePath) return undefined;
  
  const lowerPath = imagePath.toLowerCase();
  if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
    return 'image/jpeg';
  } else if (lowerPath.endsWith('.png')) {
    return 'image/png';
  } else if (lowerPath.endsWith('.gif')) {
    return 'image/gif';
  } else if (lowerPath.endsWith('.webp')) {
    return 'image/webp';
  } else if (lowerPath.endsWith('.svg')) {
    return 'image/svg+xml';
  }
  
  return undefined;
};

/**
 * Enhanced image error handler that tries multiple extensions
 * @param event The error event from img onError
 * @param fallbackExtensions Extensions to try when original fails
 */
export const handleImageError = async (
  event: React.SyntheticEvent<HTMLImageElement, Event>, 
  fallbackExtensions: string[] = ['.jpg', '.jpeg', '.png']
) => {
  const imgElement = event.target as HTMLImageElement;
  const currentSrc = imgElement.src;
  
  console.log('Error cargando imagen:', currentSrc);
  
  // Extract base path without extension
  const lastDotIndex = currentSrc.lastIndexOf('.');
  if (lastDotIndex === -1) {
    console.warn('No se encontró extensión en la ruta de la imagen');
    showImageErrorPlaceholder(imgElement);
    return;
  }
  
  const basePath = currentSrc.substring(0, lastDotIndex);
  const currentExtension = currentSrc.substring(lastDotIndex);
  
  console.log('Intentando con diferentes extensiones para:', basePath);
  
  // Remove current extension from fallback list
  const extensionsToTry = fallbackExtensions.filter(ext => ext !== currentExtension);
  
  // Try each extension using our image verification
  for (const extension of extensionsToTry) {
    const newSrc = basePath + extension;
    console.log('Probando con:', newSrc);
    
    const exists = await imageExists(newSrc);
    if (exists) {
      console.log('Imagen encontrada con extensión alternativa:', newSrc);
      imgElement.src = newSrc;
      return;
    }
  }
  
  // If all extensions failed, show error placeholder
  console.error('No se pudo cargar la imagen con ninguna alternativa');
  showImageErrorPlaceholder(imgElement);
};

/**
 * Shows an error placeholder when image loading fails completely
 * @param imgElement The image element that failed to load
 */
export const showImageErrorPlaceholder = (imgElement: HTMLImageElement) => {
  imgElement.style.display = 'none';
  
  // Create error container if it doesn't exist
  if (!imgElement.parentNode?.querySelector('.image-error-placeholder')) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'image-error-placeholder';
    errorContainer.innerHTML = `
      <div style="text-align:center; padding: 20px; border: 1px solid #eee; border-radius: 4px; background-color: #f9f9f9;">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" stroke="#FF0000" stroke-width="2"/>
          <path d="M12 8V13" stroke="#FF0000" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="16" r="1" fill="#FF0000"/>
        </svg>
        <p style="margin-top:10px; color: #666; font-size: 14px;">No se pudo cargar la imagen</p>
        <p style="margin-top:5px; color: #999; font-size: 12px;">Formatos soportados: .png, .jpg, .jpeg</p>
        <p style="margin-top:5px; color: #999; font-size: 10px;">Revise que el archivo exista en el servidor</p>
      </div>
    `;
    imgElement.parentNode?.appendChild(errorContainer);
  }
};

/**
 * Debug function to test image accessibility
 * @param imagePath Path to test
 */
export const debugImagePath = async (imagePath: string) => {
  console.log('=== DEBUG IMAGE PATH ===');
  console.log('Path original:', imagePath);
  console.log('Path formateado:', formatImagePath(imagePath));
  
  const formattedPath = formatImagePath(imagePath);
  const exists = await imageExists(formattedPath);
  console.log('¿Existe?', exists);
  
  if (!exists) {
    console.log('Probando extensiones alternativas...');
    const lastDotIndex = formattedPath.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      const basePath = formattedPath.substring(0, lastDotIndex);
      const foundPath = await findImageWithExtensions(basePath);
      console.log('Ruta encontrada con extensión alternativa:', foundPath);
    }
  }
  
  console.log('=== FIN DEBUG IMAGE PATH ===');
}; 