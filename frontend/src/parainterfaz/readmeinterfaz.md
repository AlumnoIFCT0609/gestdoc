# 🚀 Guía de Instalación - Sistema de Formularios Dinámicos

## 📋 Requisitos Previos

- Node.js v16 o superior
- PostgreSQL 12 o superior
- npm o yarn

---

## 🔧 Configuración del Backend

### 1. Instalar Dependencias

```bash
cd backend
npm install express pg bcrypt cors
npm install -D @types/express @types/pg @types/bcrypt @types/cors @types/node typescript ts-node nodemon
```

### 2. Estructura de Archivos

Crea la siguiente estructura en tu backend:

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   └── formularioDinamicoController.ts
│   ├── routes/
│   │   └── formularioDinamicoRoutes.ts
│   ├── services/
│   │   └── GestorFormulariosDinamicos.ts
│   └── server.ts
├── package.json
└── tsconfig.json
```

### 3. Configurar database.ts

Si aún no lo tienes, crea el archivo `src/config/database.ts`:

```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  user: process.env.DB_USER || 'tu_usuario',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'tu_base_datos',
  password: process.env.DB_PASSWORD || 'tu_password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test de conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en PostgreSQL:', err);
});
```

### 4. Configurar server.ts

Actualiza o crea `src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import formularioDinamicoRoutes from './routes/formularioDinamicoRoutes';

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', // Ajusta según tu frontend
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api', formularioDinamicoRoutes);

// Ruta de prueba
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// Manejo de errores
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
```

### 5. Configurar package.json (scripts)

Añade estos scripts en tu `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### 6. Configurar tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 7. Crear archivo .env (opcional)

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=mi_aplicacion
DB_PASSWORD=mipassword
DB_PORT=5432
PORT=3000
```

### 8. Iniciar el Backend

```bash
npm run dev
```

---

## 🎨 Configuración del Frontend

### 1. Instalar Dependencias

```bash
cd frontend
npm install
```

Si usas Vite + React + TypeScript, ya deberías tener las dependencias básicas. Si no:

```bash
npm install react react-dom
npm install -D @types/react @types/react-dom
```

### 2. Estructura de Archivos

```
frontend/
├── src/
│   ├── components/
│   │   ├── FormularioDinamico.tsx
│   │   └── FormularioDinamico.css
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── tsconfig.json
```

### 3. Integrar el Componente en App.tsx

```typescript
import FormularioDinamico from './components/FormularioDinamico';
import './App.css';

function App() {
  return (
    <div className="App">
      <FormularioDinamico />
    </div>
  );
}

export default App;
```

### 4. Configurar la URL de la API

En `FormularioDinamico.tsx`, verifica que la URL del backend sea correcta:

```typescript
const API_URL = 'http://localhost:3000/api'; // Ajusta según tu configuración
```

### 5. Configurar CORS en Vite (vite.config.ts)

Si usas Vite, actualiza tu `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
```

### 6. Iniciar el Frontend

```bash
npm run dev
```

---

## 🗄️ Configuración de PostgreSQL

### 1. Crear la Base de Datos

```sql
CREATE DATABASE mi_aplicacion;
```

### 2. Conectar a la Base de Datos

```bash
psql -U postgres -d mi_aplicacion
```

### 3. ¡Las Tablas se Crean Automáticamente!

El sistema creará automáticamente las tablas `tutores`, `cursos` y `alumnos` cuando proceses el primer formulario. No necesitas crear nada manualmente.

Pero si quieres verificar, después del primer registro puedes ejecutar:

```sql
\dt  -- Lista todas las tablas
\d tutores   -- Describe la tabla tutores
\d cursos    -- Describe la tabla cursos
\d alumnos   -- Describe la tabla alumnos
```

---

## ✅ Verificación de la Instalación

### 1. Verificar Backend

Abre tu navegador o Postman y prueba:

```
GET http://localhost:3000/health
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "Servidor funcionando"
}
```

### 2. Verificar Frontend

Abre tu navegador en:
```
http://localhost:5173
```

Deberías ver el formulario completo con las tres secciones.

### 3. Probar el Flujo Completo

1. Completa el formulario con datos de tutor, curso y alumno
2. Haz clic en "Registrar Alumno"
3. Deberías ver un mensaje de éxito
4. Verifica en PostgreSQL:

```sql
SELECT * FROM tutores;
SELECT * FROM cursos;
SELECT * FROM alumnos;
```

---

## 🔍 Solución de Problemas

### Error de Conexión a PostgreSQL

```bash
# Verifica que PostgreSQL esté corriendo
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# Prueba la conexión
psql -U postgres
```

### Error de CORS

Si ves errores de CORS en la consola del navegador:

1. Verifica que el backend tenga `cors` configurado
2. Asegúrate de que la URL del frontend esté en la lista de orígenes permitidos
3. Reinicia ambos servidores

### Error "Cannot find module"

```bash
# Limpia e instala de nuevo
rm -rf node_modules package-lock.json
npm install
```

### Las tablas no se crean automáticamente

Verifica los logs del backend y asegúrate de que:
1. La conexión a PostgreSQL sea exitosa
2. El usuario tenga permisos para crear tablas
3. Los datos del formulario se estén enviando correctamente

---

## 📚 Próximos Pasos

Una vez que todo funcione:

1. **Añadir validaciones adicionales** en el backend
2. **Implementar autenticación** con JWT
3. **Añadir paginación** para las listas de tutores/cursos
4. **Crear dashboard** para visualizar estadísticas
5. **Añadir edición y eliminación** de registros

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs del backend y frontend
2. Verifica la conexión a PostgreSQL
3. Asegúrate de que todas las dependencias estén instaladas
4. Comprueba que los puertos 3000 y 5173 no estén en uso

¡Listo! 🎉 Tu sistema de formularios dinámicos debería estar funcionando perfectamente.