import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase } from './database/database.js'
import routes from './routes/routes.js'
import authRoutes, { requireAuth } from './routes/authRoutes.js'
//import authRoutes from './authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import cursoRoutes from './routes/cursoRoutes.js'
import tutorRoutes from './routes/tutorRoutes.js'
import alumnoRoutes from './routes/alumnoRoutes.js'
import edicionesCursosRoutes from './routes/edicionesCursosRoutes.js'
import matriculasAlumnosRoutes from './routes/matriculaAlumnoRoutes.js'
import documentacionRoutes from './routes/documentacion.routes';

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 3000;


// Middleware
app.use(cors())
//app.use(express.json())
app.use(express.json({ limit: '50mb' }))  // ← Aumenta el límite
app.use(express.urlencoded({ limit: '50mb', extended: true }))  // ← Para formularios también

// Servir archivos estáticos de la carpeta docs
app.use('/docs', express.static(path.resolve(__dirname, '../../../docs')))

// Rutas
app.use('/api/auth', authRoutes)

// APLICAR requireAuth a TODAS las demás rutas /api
app.use('/api', requireAuth)

app.use('/api', routes)
app.use('/api', userRoutes)
app.use('/api', cursoRoutes)
app.use('/api', tutorRoutes)
app.use('/api', alumnoRoutes)
app.use('/api', edicionesCursosRoutes)
app.use('/api', matriculasAlumnosRoutes)

// Iniciar servidor
async function start() {
  try {
    await initDatabase()
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌐 Servidor corriendo en puerto ${PORT}`)
      console.log(`📡 API disponible en /api`)
    })
    // ← TEMPORAL: para verificar variables de entorno
console.log('🔍 Variables de Cloudinary:')
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || '❌ NO DEFINIDA')
console.log('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Definida' : '❌ NO DEFINIDA')
console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Definida' : '❌ NO DEFINIDA')
console.log('  USE_CLOUDINARY:', process.env.USE_CLOUDINARY)

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error)
    process.exit(1)
  }
}

start()