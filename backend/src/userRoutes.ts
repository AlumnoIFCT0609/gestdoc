import { Router } from 'express'
import bcrypt from 'bcrypt'
import pool from './database.js'

const router = Router()

// Obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, rol, ultima_entrada, fecha_creacion FROM usuarios ORDER BY id ASC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
})

// Crear nuevo usuario
router.post('/usuarios', async (req, res) => {
  const { email, password, rol } = req.body
  
  try {
    // Verificar si el email ya existe
    const existe = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    )
    
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' })
    }
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const result = await pool.query(
      'INSERT INTO usuarios (email, password, rol) VALUES ($1, $2, $3) RETURNING id, email, rol, fecha_creacion',
      [email, hashedPassword, rol || 'admin']
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al crear usuario' })
  }
})

// Actualizar usuario
router.put('/usuarios/:id', async (req, res) => {
  const { id } = req.params
  const { email, password, rol } = req.body
  
  try {
    // Si hay nueva contraseña, encriptarla
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      const result = await pool.query(
        'UPDATE usuarios SET email = $1, password = $2, rol = $3 WHERE id = $4 RETURNING id, email, rol',
        [email, hashedPassword, rol, id]
      )
      res.json(result.rows[0])
    } else {
      // Si no hay contraseña, solo actualizar email y rol
      const result = await pool.query(
        'UPDATE usuarios SET email = $1, rol = $2 WHERE id = $3 RETURNING id, email, rol',
        [email, rol, id]
      )
      res.json(result.rows[0])
    }
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
})

// Eliminar usuario
router.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params
  
  try {
    // Verificar que no sea el único admin
    const admins = await pool.query(
      'SELECT COUNT(*) as total FROM usuarios WHERE rol = $1',
      ['admin']
    )
    
    const usuario = await pool.query(
      'SELECT rol FROM usuarios WHERE id = $1',
      [id]
    )
    
    if (usuario.rows[0]?.rol === 'admin' && parseInt(admins.rows[0].total) <= 1) {
      return res.status(400).json({ error: 'No puedes eliminar el único administrador' })
    }
    
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id])
    res.json({ mensaje: 'Usuario eliminado' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al eliminar usuario' })
  }
})

export default router