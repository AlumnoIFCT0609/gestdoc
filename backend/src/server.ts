import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase } from './database.js'
import routes from './routes.js'
import authRoutes from './authRoutes.js'
import userRoutes from './userRoutes.js'
import cursoRoutes from './cursoRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3000

// Middleware
app.use(cors())
app.use(express.json())

// Servir archivos estáticos de la carpeta docs
app.use('/docs', express.static(path.resolve(__dirname, '../../../docs')))


// Rutas
app.use('/api/auth', authRoutes)
app.use('/api', routes)
app.use('/api', userRoutes)
app.use('/api', cursoRoutes)

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ mensaje: '🚀 Servidor funcionando correctamente' })
})

// Iniciar servidor
async function start() {
  try {
    await initDatabase()
    
    app.listen(PORT, () => {
      console.log(`🌐 Servidor corriendo en http://localhost:${PORT}`)
      console.log(`📡 API disponible en http://localhost:${PORT}/api`)
    })
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error)
    process.exit(1)
  }
}

start()