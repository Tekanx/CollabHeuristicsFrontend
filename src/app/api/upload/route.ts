import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Formatos de imagen permitidos
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png'];

// Tamaño máximo de archivo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    console.log('=== INICIO UPLOAD DE IMAGEN (Next.js API) ===');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const directorio = formData.get('directorio') as string;
    const fileName = formData.get('fileName') as string;

    console.log('Archivo recibido:', fileName);
    console.log('Directorio destino:', directorio);
    console.log('Tamaño del archivo:', file.size, 'bytes');
    console.log('Tipo de contenido:', file.type);

    // Validaciones de archivo
    if (!file) {
      return NextResponse.json(
        { error: 'No se ha seleccionado ningún archivo' },
        { status: 400 }
      );
    }

    // Validar formato
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato de imagen no soportado. Solo se permiten .jpg, .jpeg y .png' },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Tamaño máximo: 5MB' },
        { status: 400 }
      );
    }

    // Validar nombre de directorio (solo caracteres alfanuméricos)
    if (!directorio.match(/^[a-zA-Z0-9]+$/)) {
      return NextResponse.json(
        { error: 'Nombre de directorio inválido' },
        { status: 400 }
      );
    }

    // Obtener la ruta del directorio public
    const publicPath = path.join(process.cwd(), 'public', directorio);
    
    console.log('Ruta del directorio:', publicPath);

    // Crear el directorio si no existe
    if (!existsSync(publicPath)) {
      await mkdir(publicPath, { recursive: true });
      console.log('Directorio creado:', publicPath);
    } else {
      console.log('Directorio ya existe:', publicPath);
    }

    // Ruta completa del archivo
    const filePath = path.join(publicPath, fileName);
    console.log('Ruta completa del archivo:', filePath);

    // Convertir el archivo a buffer y guardarlo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);
    console.log('Archivo guardado exitosamente');

    // Verificar que el archivo se guardó
    if (!existsSync(filePath)) {
      console.error('Error: El archivo no se guardó correctamente');
      return NextResponse.json(
        { error: 'Error al guardar el archivo' },
        { status: 500 }
      );
    }

    // Generar la ruta que se guardará en la base de datos (ruta relativa para Next.js)
    const dbPath = `/${directorio}/${fileName}`;
    
    console.log('Ruta para DB:', dbPath);
    console.log('=== FIN UPLOAD DE IMAGEN (Next.js API) ===');

    return NextResponse.json({
      success: true,
      filePath: dbPath,
      message: 'Imagen subida exitosamente',
      fileName: fileName,
      directorio: directorio,
      savedLocation: filePath
    });

  } catch (error) {
    console.error('Error al subir archivo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la imagen' },
      { status: 500 }
    );
  }
}

// Endpoint para verificar si una imagen existe
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const directorio = searchParams.get('directorio');
    const fileName = searchParams.get('fileName');

    if (!directorio || !fileName) {
      return new NextResponse(null, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', directorio, fileName);
    
    if (existsSync(filePath)) {
      return new NextResponse(null, { status: 200 });
    } else {
      return new NextResponse(null, { status: 404 });
    }
  } catch (error) {
    console.error('Error al verificar archivo:', error);
    return new NextResponse(null, { status: 500 });
  }
} 