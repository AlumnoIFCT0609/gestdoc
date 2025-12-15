import { Router } from 'express'
import pool from './database.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Obtener todos los documentos
router.get('/documentos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM indice ORDER BY id DESC')
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener documentos' })
  }
})

// Crear nuevo documento
router.post('/documentos', async (req, res) => {
  const { enlace, tema, curso, autor, activo } = req.body
  
  try {
    const result = await pool.query(
      'INSERT INTO indice (enlace, tema, curso, autor, activo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [enlace, tema, curso, autor, activo]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al crear documento' })
  }
})

// Actualizar documento
router.put('/documentos/:id', async (req, res) => {
  const { id } = req.params
  const { enlace, tema, curso, autor, activo } = req.body
  
  try {
    const result = await pool.query(
      'UPDATE indice SET enlace = $1, tema = $2, curso = $3, autor = $4, activo=$5 WHERE id = $6 RETURNING *',
      [enlace, tema, curso, autor, activo, id]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al actualizar documento' })
  }
})

// Eliminar documento
router.delete('/documentos/:id', async (req, res) => {
  const { id } = req.params
  
  try {
    await pool.query('DELETE FROM indice WHERE id = $1', [id])
    res.json({ mensaje: 'Documento eliminado' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al eliminar documento' })
  }
})

// Cargar PDFs desde la carpeta docs/
router.post('/cargar-pdfs', async (req, res) => {
  try {
    // La ruta correcta es: miWeb/docs (al mismo nivel que backend y frontend)
    const docsPath = path.resolve(__dirname, '../../../docs')
    
    console.log('📁 Buscando PDFs en:', docsPath)
    
    if (!fs.existsSync(docsPath)) {
      console.error('❌ Carpeta no encontrada:', docsPath)
      return res.status(404).json({ 
        error: 'Carpeta docs/ no encontrada',
        ruta: docsPath 
      })
    }

    let contador = 0
    let duplicados = 0
    const pdfsEncontrados: string[] = []
    const pdfsDuplicados: string[] = []
    
    async function escanearCarpeta(carpetaPath: string, carpetaRelativa: string = '') {
      const archivos = fs.readdirSync(carpetaPath)
      
      for (const archivo of archivos) {
        const rutaCompleta = path.join(carpetaPath, archivo)
        const stats = fs.statSync(rutaCompleta)
        
        if (stats.isDirectory()) {
          // Escanear subdirectorios recursivamente
          await escanearCarpeta(rutaCompleta, path.join(carpetaRelativa, archivo))
        } else if (archivo.toLowerCase().endsWith('.pdf') || archivo.toLowerCase().endsWith('.odt')) {
          const enlaceRelativo = path.join(carpetaRelativa, archivo).replace(/\\/g, '/')
          const enlace = `/docs/${enlaceRelativo}`
          const tema = carpetaRelativa || 'General'
          
          try {
            // Verificar si ya existe en la base de datos
            const existe = await pool.query(
              'SELECT id FROM indice WHERE enlace = $1',
              [enlace]
            )
            
            if (existe.rows.length > 0) {
              // Ya existe, no insertar
              pdfsDuplicados.push(enlace)
              duplicados++
              console.log(`⏭️  Saltado (ya existe): ${enlace}`)
            } else {
              // No existe, insertar
              await pool.query(
                'INSERT INTO indice (enlace, tema, curso, autor, activo) VALUES ($1, $2, $3, $4, $5)',
                [enlace, tema, 'Por definir', 'Sistema',true]
              )
              pdfsEncontrados.push(enlace)
              contador++
              console.log(`✅ Agregado: ${enlace}`)
            }
          } catch (error: any) {
            console.error('Error al procesar:', enlace, error)
          }
        }
      }
    }
    
    await escanearCarpeta(docsPath)
    
    console.log(`\n📊 Resumen:`)
    console.log(`   ✅ PDFs nuevos agregados: ${contador}`)
    console.log(`   ⏭️  PDFs ya existentes: ${duplicados}`)
    
    res.json({ 
      mensaje: `✅ ${contador} PDFs nuevos agregados${duplicados > 0 ? ` • ${duplicados} ya existían` : ''}`,
      nuevos: contador,
      duplicados: duplicados,
      total: contador + duplicados,
      pdfsNuevos: pdfsEncontrados,
      pdfsDuplicados: pdfsDuplicados
    })
  } catch (error) {
    console.error('❌ Error al cargar PDFs:', error)
    res.status(500).json({ 
      error: 'Error al cargar PDFs',
      detalle: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
})

export default router