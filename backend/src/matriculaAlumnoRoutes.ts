import { Router } from 'express'
import pool from './database.js'

const router = Router()

// Obtener todos los cursos
router.get('/matriculasalumnos', async (req, res) => {
  try {

    const result = await pool.query(
      'SELECT id, ediciones_cursos_id, activo, alumno_id FROM matriculasalumnos ORDER BY id ASC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener las ediciones de los cursos' })
  }
})


// Crear nuevo curso
router.post('/matriculasalumnos', async (req, res) => {
  const { ediciones_cursos_id, activo, alumno_id } = req.body
  
  try {
    // Verificar si el codigo ya existe
    const existe = await pool.query(
      'SELECT ediciones_cursos_id, alumno_id FROM matriculasalumnos WHERE ediciones_cursos_id = $1 AND alumno_id =$2 ',
      [ediciones_cursos_id, alumno_id]
    )
    
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: ' la matriculación del alumno ya está registrada' })
    }
    
        
    const result = await pool.query(
      'INSERT INTO matriculasalumnos (ediciones_cursos_id, activo, alumno_id) VALUES ($1, $2, $3) RETURNING ediciones_cursos_id,activo,alumno_id',
       [ediciones_cursos_id,activo, alumno_id ]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al matricular alumno' })
  }
})

// Actualizar curso
router.put('/matriculasalumnos/:id', async (req, res) => {
  const { id } = req.params
  const { ediciones_cursos_id,activo,alumnos_id} = req.body
  
  try {
  
   
      const result = await pool.query(
        'UPDATE matriculasalumnos SET ediciones_cursos_id = $1, activo = $2 , alumno_id=$3 WHERE id = $4 RETURNING id, ediciones_cursos_id,activo, alumno_id',
        [ediciones_cursos_id,activo, alumnos_id, id]
      )
      res.json(result.rows[0])
    
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al actualizar la matricula del alumno' })
  }
})

// Eliminar curso
router.delete('/matriculasalumnos/:id', async (req, res) => {
  const { id } = req.params
  
  try {
       
    await pool.query('DELETE FROM matriculasalumnos WHERE id = $1', [id])
    res.json({ mensaje: 'matricula del alumno eliminada' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al eliminar la matricula del alumno' })
  }
})

// Obtener listado de cursos para el select
router.get('/matriculasalumnos/selectores/edicionescursos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ec.id, 
        ec.curso_id, 
        c.descripcion,
        ec.fecha_inicio, 
        ec.fecha_fin,
        ec.tutor_id,
        ec.maximo_alumnos
      FROM edicionescursos ec
      INNER JOIN cursos c ON ec.curso_id = c.id
      WHERE ec.activo = true 
      ORDER BY c.descripcion ASC, ec.fecha_inicio DESC`
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener ediciones de cursos' })
  }
})

// Obtener listado de tutores para el select
router.get('/matriculasalumnos/selectores/alumnos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, apellidos FROM alumnos WHERE activo = true ORDER BY apellidos, nombre ASC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener alumnos' })
  }
})

export default router