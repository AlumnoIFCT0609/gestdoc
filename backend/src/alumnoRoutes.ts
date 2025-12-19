import { Router } from 'express'
import bcrypt from 'bcrypt'
import pool from './database.js'

const router = Router()

// Obtener todos los cursos
router.get('/alumnos', async (req, res) => {
  try {

    
    const result = await pool.query(
      'SELECT id, nombre, apellidos, dni, email,tlf, grupo, observaciones, activo, fecha_creacion FROM alumnos ORDER BY id ASC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener alumnos' })
  }
})


// Crear nuevo alumno
router.post('/alumnos', async (req, res) => {
  const { nombre, apellidos,dni, email,tlf, grupo, observaciones, activo } = req.body
  
  try {
    // Verificar si el email ya existe
    const existe = await pool.query(
      'SELECT id FROM alumnos WHERE email = $1',
      [email]
    )
    
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El alumno ya está registrado' })
    }
    
        
    const result = await pool.query(
      'INSERT INTO alumnos (nombre, apellidos, dni, email,tlf, grupo, observaciones, activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8 ) RETURNING id, nombre, apellidos, dni, email,tlf, grupo, observaciones, activo, fecha_creacion',
       [nombre, apellidos, dni, email,tlf, grupo, observaciones, activo]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al crear alumno' })
  }
})

// Actualizar curso
router.put('/alumnos/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, apellidos, dni, email,tlf, grupo, observaciones, activo } = req.body
  
  try {
  
   
      const result = await pool.query(
        'UPDATE alumnos SET nombre = $1, apellidos = $2 , dni = $3,email = $4, tlf = $5, grupo = $6, observaciones = $7, activo = $8 WHERE id = $9 RETURNING id, nombre, apellidos, dni, email,tlf, grupo, observaciones, activo',
        [nombre, apellidos, dni, email,tlf, grupo, observaciones, activo, id]
      )
      res.json(result.rows[0])
    
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al actualizar tutores' })
  }
})

// Eliminar curso
router.delete('/alumnos/:id', async (req, res) => {
  const { id } = req.params
  
  try {
       
    await pool.query('DELETE FROM alumnos WHERE id = $1', [id])
    res.json({ mensaje: 'Alumno eliminado' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al eliminar alumno' })
  }
})

// Obtener un tutor por ID
router.get('/alumnos/:id', async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      'SELECT * FROM alumnos WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alumno no encontrado' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener alumno' })
  }
})

export default router