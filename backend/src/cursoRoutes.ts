import { Router } from 'express'
import pool from './database.js'

const router = Router()

// Obtener todos los cursos
router.get('/cursos', async (req, res) => {
  try {

    const result = await pool.query(
      'SELECT id, codigo, descripcion, duracion_horas, observaciones, nivel, activo, fecha_creacion FROM cursos ORDER BY id ASC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener cursos' })
  }
})


// Crear nuevo curso
router.post('/cursos', async (req, res) => {
  const { codigo, descripcion, duracion_horas, observaciones,nivel, activo } = req.body
  
  try {
    // Verificar si el codigo ya existe
    const existe = await pool.query(
      'SELECT id FROM cursos WHERE codigo = $1',
      [codigo]
    )
    
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El curso ya está registrado' })
    }
    
        
    const result = await pool.query(
      'INSERT INTO cursos (codigo, descripcion, duracion_horas, observaciones,nivel, activo) VALUES ($1, $2, $3, $4,$5,$6) RETURNING id, codigo, descripcion, duracion_horas, observaciones,nivel,activo fecha_creacion',
       [codigo, descripcion, duracion_horas, observaciones, nivel, activo]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al crear curso' })
  }
})

// Actualizar curso
router.put('/cursos/:id', async (req, res) => {
  const { id } = req.params
  const { codigo, descripcion, duracion_horas, observaciones,nivel, activo } = req.body
  
  try {
  
   
      const result = await pool.query(
        'UPDATE cursos SET codigo = $1, descripcion = $2 , duracion_horas = $3, observaciones = $4, nivel=$5, activo = $6 WHERE id = $7 RETURNING id, codigo, descripcion, duracion_horas, observaciones, nivel, activo',
        [codigo, descripcion, duracion_horas, observaciones, nivel, activo, id]
      )
      res.json(result.rows[0])
    
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al actualizar curso' })
  }
})

// Eliminar curso
router.delete('/cursos/:id', async (req, res) => {
  const { id } = req.params
  
  try {
       
    await pool.query('DELETE FROM cursos WHERE id = $1', [id])
    res.json({ mensaje: 'Curso eliminado' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al eliminar curso' })
  }
})

export default router