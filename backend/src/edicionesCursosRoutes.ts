import { Router } from 'express'
import pool from './database.js'

const router = Router()

// Obtener todos los cursos
router.get('/edicionescursos', async (req, res) => {
  try {

    const result = await pool.query(
      'SELECT id, curso_id, activo, fecha_inicio, fecha_fin, tutor_id, maximo_alumnos FROM edicionescursos ORDER BY id ASC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener las ediciones de los cursos' })
  }
})


// Crear nuevo curso
router.post('/edicionescursos', async (req, res) => {
  const { curso_id, activo, fecha_inicio, fecha_fin, tutor_id, maximo_alumnos } = req.body
  
  try {
    // Verificar si el codigo ya existe
    const existe = await pool.query(
      'SELECT curso_id, fecha_inicio, fecha_fin, tutor_id FROM edicionescursos WHERE curso_id = $1 AND fecha_inicio = $2 AND fecha_fin=$3 AND tutor_id =$4 ',
      [curso_id, fecha_inicio, fecha_fin, tutor_id]
    )
    
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: ' la edicion del curso ya está registrada' })
    }
    
        
    const result = await pool.query(
      'INSERT INTO edicionescursos (curso_id, activo, fecha_inicio, fecha_fin, tutor_id, maximo_alumnos) VALUES ($1, $2, $3, $4,$5,$6) RETURNING curso_id,activo, fecha_inicio, fecha_fin, tutor_id, maximo_alumnos',
       [curso_id,activo, fecha_inicio, fecha_fin, tutor_id, maximo_alumnos ]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al crear curso' })
  }
})

// Actualizar curso
router.put('/edicionescursos/:id', async (req, res) => {
  const { id } = req.params
  const { curso_id,activo, fecha_inicio, fecha_fin, tutor_id, maximo_alumnos} = req.body
  
  try {
  
   
      const result = await pool.query(
        'UPDATE edicionescursos SET curso_id = $1, activo = $2 , fecha_inicio = $3, fecha_fin = $4, tutor_id=$5, maximo_alumnos=$6 WHERE id = $7 RETURNING id, curso_id,activo, fecha_inicio, fecha_fin, tutor_id, maximo_alumnos',
        [curso_id,activo, fecha_inicio, fecha_fin, tutor_id,maximo_alumnos, id]
      )
      res.json(result.rows[0])
    
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al actualizar la edicion del curso' })
  }
})

// Eliminar curso
router.delete('/edicionescursos/:id', async (req, res) => {
  const { id } = req.params
  
  try {
       
    await pool.query('DELETE FROM edicionescursos WHERE id = $1', [id])
    res.json({ mensaje: 'Edicion del curso eliminada' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al eliminar la edicion del curso' })
  }
})

// Obtener listado de cursos para el select
router.get('/edicionescursos/selectores/cursos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, codigo, descripcion FROM cursos WHERE activo = true ORDER BY descripcion ASC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener cursos' })
  }
})

// Obtener listado de tutores para el select
router.get('/edicionescursos/selectores/tutores', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, apellidos FROM tutores WHERE activo = true ORDER BY apellidos, nombre ASC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener tutores' })
  }
})

export default router