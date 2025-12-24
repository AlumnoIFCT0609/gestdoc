import { Router } from 'express'
import bcrypt from 'bcrypt'
import pool from '../database/database.js'

const router = Router()

// Obtener todos los tutores
router.get('/tutores', async (req, res) => {
  try {

    

    const result = await pool.query(
      'SELECT id, nombre, apellidos, dni, email,tlf, especialidad, observaciones, activo, fecha_creacion FROM tutores ORDER BY id ASC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener tutores' })
  }
})


// Crear nuevo tutor
router.post('/tutores', async (req, res) => {
  const { nombre, apellidos,dni, email,tlf, especialidad, observaciones, activo } = req.body
  
  try {
    // Verificar si el email ya existe
    const existe = await pool.query(
      'SELECT id FROM tutores WHERE email = $1',
      [email]
    )
    
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El tutor ya está registrado' })
    }
    
        
    const result = await pool.query(
      'INSERT INTO tutores (nombre, apellidos, dni, email,tlf, especialidad, observaciones, activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8 ) RETURNING id, nombre, apellidos, dni, email,tlf, especialidad, observaciones, activo, fecha_creacion',
       [nombre, apellidos, dni, email,tlf, especialidad, observaciones, activo]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al crear tutor' })
  }
})

// Actualizar tutor
router.put('/tutores/:id', async (req, res) => {
  const { id } = req.params
  const { nombre, apellidos, dni, email,tlf, especialidad, observaciones, activo } = req.body
  
  try {
  
   
      const result = await pool.query(
        'UPDATE tutores SET nombre = $1, apellidos = $2 , dni = $3,email = $4, tlf = $5, especialidad = $6, observaciones = $7, activo = $8 WHERE id = $9 RETURNING id, nombre, apellidos, dni, email,tlf, especialidad, observaciones, activo',
        [nombre, apellidos, dni, email,tlf, especialidad, observaciones, activo, id]
      )
      res.json(result.rows[0])
    
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al actualizar tutores' })
  }
})

// Eliminar tutor
router.delete('/tutores/:id', async (req, res) => {
  const { id } = req.params
  
  try {
       
    await pool.query('DELETE FROM tutores WHERE id = $1', [id])
    res.json({ mensaje: 'Tutor eliminado' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al eliminar tutor' })
  }
})

// Obtener un tutor por ID
router.get('/tutores/:id', async (req, res) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      'SELECT * FROM tutores WHERE id = $1',
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tutor no encontrado' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener tutor' })
  }
})


export default router