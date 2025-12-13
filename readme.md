# 📁 ESTRUCTURA DEL PROYECTO

```
miWeb/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── database.ts
│   │   └── routes.ts
│   ├── package.json
│   └── tsconfig.json
└── docs/
    └── (carpetas con PDFs)
```

---

# 📝 EXPLICACIÓN DE CADA FICHERO

## **FRONTEND**

### **frontend/package.json**
- Gestiona las dependencias del frontend (React, TypeScript, Tailwind, Vite)
- Scripts para desarrollo (`dev`) y compilación (`build`)

### **frontend/tsconfig.json**
- Configuración principal de TypeScript para el frontend
- Define reglas de compilación y módulos

### **frontend/tsconfig.node.json**
- Configuración de TypeScript específica para Vite
- Necesaria para que `vite.config.ts` compile correctamente

### **frontend/vite.config.ts**
- Configuración de Vite (bundler moderno y rápido)
- Define el servidor de desarrollo en puerto 3001

### **frontend/tailwind.config.js**
- Configuración de Tailwind CSS
- Define dónde buscar clases CSS

### **frontend/postcss.config.js**
- Configuración de PostCSS
- Necesario para que Tailwind procese los estilos CSS

### **frontend/index.html**
- Punto de entrada HTML de la aplicación
- Carga el archivo TypeScript principal

### **frontend/src/main.tsx**
- Punto de entrada TypeScript
- Inicializa React y monta la aplicación

### **frontend/src/index.css**
- Estilos globales con directivas de Tailwind

### **frontend/src/App.tsx**
- Componente principal de React
- Interfaz CRUD completa con formularios y tabla
- Maneja toda la lógica de la aplicación

---

## **BACKEND**

### **backend/package.json**
- Gestiona dependencias del backend (Express, PostgreSQL, CORS)
- Script para desarrollo (`dev`)

### **backend/tsconfig.json**
- Configuración de TypeScript para el backend
- Compilación a CommonJS para Node.js

### **backend/src/database.ts**
- Conexión a PostgreSQL
- **Crea automáticamente la base de datos "documentacion" si no existe**
- **Crea automáticamente la tabla "indice" si no existe**
- Exporta el pool de conexiones

### **backend/src/routes.ts**
- Define todas las rutas de la API REST:
  - GET /api/documentos - Lista todos
  - POST /api/documentos - Crea nuevo
  - PUT /api/documentos/:id - Actualiza
  - DELETE /api/documentos/:id - Elimina
  - POST /api/cargar-pdfs - Escanea carpeta docs/

### **backend/src/server.ts**
- Servidor Express en puerto 3000
- Configuración de CORS y middleware
- Inicializa la base de datos

---

# 🎯 FUNCIONALIDADES

1. **CRUD Completo**: Crear, leer, actualizar y eliminar documentos
2. **Escaneo de PDFs**: Botón que lee la carpeta `docs/` y guarda enlaces
3. **Enlaces Web**: Formulario para añadir URLs manualmente
4. **Base de Datos**: PostgreSQL con creación automática
5. **Interfaz Moderna**: Tailwind CSS con diseño responsive
6. **TypeScript**: Tipado estático en frontend y backend