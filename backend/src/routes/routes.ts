import { Router } from 'express'
import pool from '../database/database.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import cloudinary from '../config/cloudinary.js' // ← NUEVO

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

// Cargar PDFs desde carpeta local O desde Cloudinary
router.post('/cargar-pdfs', async (req, res) => {
  try {
    // Detectar si estamos usando Cloudinary o local
    const usarCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME
    
    if (usarCloudinary) {
      // ==================== CLOUDINARY ====================
      console.log('☁️  Cargando PDFs desde Cloudinary...')
      
      let contador = 0
      let duplicados = 0
      const pdfsEncontrados: string[] = []
      const pdfsDuplicados: string[] = []
      
      try {
        // Listar todos los archivos raw en Cloudinary
        const result = await cloudinary.api.resources({
          type: 'upload',
          resource_type: 'raw',
          prefix: 'documentacion/', // Carpeta en Cloudinary
          max_results: 500
        })
        
        for (const resource of result.resources) {
          const enlace = resource.secure_url
          const filename = resource.public_id.split('/').pop() || 'Sin nombre'
          const carpeta = resource.public_id.split('/').slice(0, -1).join('/') || 'General'
          const tema = carpeta.replace('documentacion/', '') || 'General'
          
          // Solo procesar PDFs
          if (filename.toLowerCase().endsWith('.pdf')) {
            try {
              // Verificar si ya existe
              const existe = await pool.query(
                'SELECT id FROM indice WHERE enlace = $1',
                [enlace]
              )
              
              if (existe.rows.length > 0) {
                pdfsDuplicados.push(enlace)
                duplicados++
                console.log(`⏭️  Saltado (ya existe): ${filename}`)
              } else {
                // Insertar nuevo
                await pool.query(
                  'INSERT INTO indice (enlace, tema, curso, autor, activo) VALUES ($1, $2, $3, $4, $5)',
                  [enlace, tema, 'Por definir', 'Sistema', true]
                )
                pdfsEncontrados.push(enlace)
                contador++
                console.log(`✅ Agregado desde Cloudinary: ${filename}`)
              }
            } catch (error) {
              console.error('Error al procesar:', filename, error)
            }
          }
        }
        
        console.log(`\n📊 Resumen (Cloudinary):`)
        console.log(`   ✅ PDFs nuevos agregados: ${contador}`)
        console.log(`   ⏭️  PDFs ya existentes: ${duplicados}`)
        
        return res.json({ 
          mensaje: `☁️ ${contador} PDFs nuevos desde Cloudinary${duplicados > 0 ? ` • ${duplicados} ya existían` : ''}`,
          fuente: 'cloudinary',
          nuevos: contador,
          duplicados: duplicados,
          total: contador + duplicados,
          pdfsNuevos: pdfsEncontrados,
          pdfsDuplicados: pdfsDuplicados
        })
      } catch (cloudinaryError) {
        console.error('❌ Error con Cloudinary:', cloudinaryError)
        return res.status(500).json({ 
          error: 'Error al listar archivos de Cloudinary',
          detalle: cloudinaryError instanceof Error ? cloudinaryError.message : 'Error desconocido'
        })
      }
      
    } else {
      // ==================== LOCAL ====================
      console.log('💾 Cargando PDFs desde carpeta local...')
      
      const docsPath = path.resolve(__dirname, '../../../../docs')
      
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
                  [enlace, tema, 'Por definir', 'Sistema', true]
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
      
      console.log(`\n📊 Resumen (Local):`)
      console.log(`   ✅ PDFs nuevos agregados: ${contador}`)
      console.log(`   ⏭️  PDFs ya existentes: ${duplicados}`)
      
      return res.json({ 
        mensaje: `💾 ${contador} PDFs nuevos agregados${duplicados > 0 ? ` • ${duplicados} ya existían` : ''}`,
        fuente: 'local',
        nuevos: contador,
        duplicados: duplicados,
        total: contador + duplicados,
        pdfsNuevos: pdfsEncontrados,
        pdfsDuplicados: pdfsDuplicados
      })
    }
    
  } catch (error) {
    console.error('❌ Error al cargar PDFs:', error)
    res.status(500).json({ 
      error: 'Error al cargar PDFs',
      detalle: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
})

// Subir PDF a Cloudinary
router.post('/subir-pdf-cloudinary', async (req, res) => {
  try {
    // Verificar que Cloudinary está configurado
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ 
        error: 'Cloudinary no está configurado en el servidor' 
      })
    }

    const { fileBase64, filename, carpeta } = req.body

    if (!fileBase64 || !filename) {
      return res.status(400).json({ 
        error: 'Faltan datos: fileBase64 y filename son requeridos' 
      })
    }

    console.log(`📤 Subiendo "${filename}" a Cloudinary...`)

    // Subir a Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        fileBase64,
        {
          resource_type: 'raw',
          folder: `documentacion/${carpeta || 'general'}`,
          public_id: filename.replace('.pdf', ''),
          format: 'pdf',
          type: 'upload',
          access_mode: 'public' 
        },
        (error: any, result: any) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
    })

    const uploadResult: any = result

    console.log(`✅ PDF subido exitosamente: ${uploadResult.secure_url}`)

    res.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      mensaje: `✅ "${filename}" subido correctamente`
    })

  } catch (error) {
    console.error('❌ Error al subir PDF:', error)
    res.status(500).json({ 
      error: 'Error al subir PDF a Cloudinary',
      detalle: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
})



export default router