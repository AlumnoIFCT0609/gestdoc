import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import pool from '../database/database.js'

const router = Router()
const JWT_SECRET = 'tu-secreto-super-seguro-cambialo-en-produccion'

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body

  try {
    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const usuario = result.rows[0]

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password)

    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // Actualizar última entrada
    await pool.query(
      'UPDATE usuarios SET ultima_entrada = NOW() WHERE id = $1',
      [usuario.id]
    )

    // Generar token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        activo:usuario.activo
      }
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

// Verificar token
router.post('/verificar', async (req, res) => {
  const { token } = req.body

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Verificar que el usuario aún existe
    const result = await pool.query(
      'SELECT id, email, rol FROM usuarios WHERE id = $1',
      [decoded.id]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    res.json({ 
      valido: true, 
      usuario: result.rows[0] 
    })
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
})

// Middleware para proteger rutas
export function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.usuario = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' })
  }
}

export default router