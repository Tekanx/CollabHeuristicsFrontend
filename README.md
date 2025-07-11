# HeuristicApp Frontend

Al realizar un pull del proyecto, recuerde realizar `npm install` / `npm i` 

## 📋 Prerrequisitos

Antes de ejecutar el frontend, asegúrate de tener instalado:

- **Node.js** (versión 18.17 o superior)
- **npm** (viene incluido con Node.js) o **yarn**
- **Git** o **GitHub** para clonar el repositorio
- **Backend HeuristicApp** ejecutándose en `http://localhost:8085`

### Verificar instalaciones

```bash
# Verifica Node.js
node --version

# Verifica npm
npm --version

# Verifica yarn (opcional)
yarn --version
```


## 🚀 Instalación y Ejecución

### Opción 1: Usando npm (Recomendado)

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd CollabHeuristicsFrontend

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:3000
```

### Opción 2: Usando yarn

```bash
# 1. Navegar al directorio
cd CollabHeuristicsFrontend

# 2. Instalar dependencias
yarn install

# 3. Ejecutar en modo desarrollo
yarn dev
```

### Opción 3: Producción

```bash
# 1. Construir para producción
npm run build

# 2. Ejecutar en modo producción
npm run start

# La aplicación estará disponible en http://localhost:3000
```

### Variables de entorno para producción

Crear archivo `.env.local`:

```env
# URL del backend en producción
NEXT_PUBLIC_API_URL=https://tu-backend.com/api
```

## ⚙️ Configuración

### Variables de Entorno

El proyecto está configurado para conectarse automáticamente al backend. La configuración se encuentra en `next.config.js`:

```javascript
// Redirección automática de /api/* hacia el backend
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8085/api/:path*'
    }
  ]
}
```

### Personalizar configuración

Si necesitas cambiar la URL del backend, edita el archivo `next.config.js`:

```javascript
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://tu-backend-url:puerto/api/:path*'
      }
    ]
  }
}
```

## 🔧 Comandos de Mantenimiento

```bash
# Actualizar dependencias
npm update

# Verificar vulnerabilidades
npm audit

# Corregir vulnerabilidades automáticamente
npm audit fix

# Verificar estructura del proyecto
npm run lint
```

## 🌐 Verificación de Instalación

Una vez ejecutado correctamente, el frontend estará disponible en:

- **URL de Desarrollo**: `http://localhost:3000`
- **Página de Login**: `http://localhost:3000/login`
- **Dashboard**: `http://localhost:3000/dashboard`

### Respuesta exitosa

Si el frontend se ejecuta correctamente, verás en la consola:

```
✓ Ready in X.Xs (turbo)
✓ Local:    http://localhost:3000
```

## 🔧 Scripts Disponibles

```bash
# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar aplicación construida
npm run start

# Ejecutar linter
npm run lint

# Instalar dependencias
npm install
```
Para ver los scripts implementados por Next.js revise el archivo "package.json"

## 📚 Tecnologías Utilizadas

- **Next.js 14.1.0** - Framework React con App Router
- **React 18.2.0** - Biblioteca principal de UI
- **TypeScript 5.8.2** - Tipado estático
- **Material-UI 5.15.10** - Sistema de diseño
- **Axios 1.9.0** - Cliente HTTP para API calls
- **Chart.js 4.4.9** - Gráficos y visualizaciones
- **bcryptjs 2.4.3** - Hashing de contraseñas (cliente)

## 🔗 Conexión con Backend

El frontend está configurado para conectarse automáticamente con el backend que debe estar ejecutándose en:

- **URL Backend**: `http://localhost:8085`
- **Endpoints principales**:
  - `/api/auth/login` - Autenticación
  - `/api/heuristicas` - Gestión de heurísticas
  - `/api/evaluaciones` - Gestión de evaluaciones
  - `/api/problemas` - Gestión de problemas

## 🐛 Solución de Problemas

### Error de conexión con backend

```bash
# Verificar que el backend esté ejecutándose
curl http://localhost:8085/api/heuristicas

# Si no responde, iniciar el backend primero
cd ../CollabHeuristicsBackend/collabheuristics
./mvnw spring-boot:run
```

### Error de puerto ocupado

Si el puerto 3000 está ocupado:

```bash
# Especificar puerto diferente
PORT=3001 npm run dev

# O cambiar en package.json
"dev": "next dev -p 3001"
```

### Errores de dependencias

```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

### Errores de TypeScript

```bash
# Verificar y corregir tipos
npm run lint

# Regenerar tipos de Next.js
rm -rf .next
npm run dev
```

## 👥 Autores

- **Tekanx** - Autor y Desarrollador principal

## 📝 Notas Adicionales

- Asegúrate de que el backend esté ejecutándose antes de iniciar el frontend
- Las imágenes se cargan desde la carpeta `public/`
- Material-UI proporciona componentes prediseñados y consistentes 
- El desarrollo no aplica practicas recomendables ya que no soy experto en el conjunto de tecnologias aplicadas, pero fue un buen desafio