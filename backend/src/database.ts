import pkg from 'pg'
const { Pool, Client } = pkg

// Primero conectamos a la BD postgres por defecto para crear nuestra BD
async function createDatabaseIfNotExists() {
  const client = new Client({
    user: 'admin',
    host: 'localhost',
    database: 'postgres',
    password: '1469Alw2018',
    port: 5432,
  })

  try {
    await client.connect()
    
    // Verificar si la BD existe
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'documentacion'"
    )
    
    if (result.rows.length === 0) {
      // Crear la base de datos
      await client.query('CREATE DATABASE documentacion')
      console.log('✅ Base de datos "documentacion" creada')
    } else {
      console.log('✅ Base de datos "documentacion" ya existe')
    }
  } catch (error) {
    console.error('❌ Error al crear la base de datos:', error)
    throw error
  } finally {
    await client.end()
  }
}

// Ahora el pool para conectar a nuestra BD
const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'documentacion',
  password: '1469Alw2018',
  port: 5432,
})

export async function initDatabase() {
  // Primero crear la BD si no existe
  await createDatabaseIfNotExists()
  
  // Luego crear las tablas
  const client = await pool.connect()
  
  try {
    // Tabla de índice de documentos
    await client.query(`
      CREATE TABLE IF NOT EXISTS indice (
        id SERIAL PRIMARY KEY,
        enlace TEXT NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tema VARCHAR(255) NOT NULL,
        curso VARCHAR(255) NOT NULL,
        autor VARCHAR(255) NOT NULL
      )
    `)
    console.log('✅ Tabla "indice" lista')
    
    // Tabla de usuarios
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(50) DEFAULT 'admin',
        ultima_entrada TIMESTAMP,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tabla "usuarios" lista')
    
    // Tabla de cursos
    await client.query(`
      CREATE TABLE IF NOT EXISTS cursos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(25) UNIQUE NOT NULL,
        descripcion VARCHAR(255) NOT NULL,
        duracion_horas INTEGER  DEFAULT 50,
        observaciones TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tabla "cursos" lista')

    // Verificar si ya existe el usuario admin
    const existeAdmin = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      ['admin@admin.com']
    )
    
    if (existeAdmin.rows.length === 0) {
      // Crear usuario admin por defecto
      const bcrypt = await import('bcrypt')
      const hashedPassword = await bcrypt.hash('admin123', 10)
      
      await client.query(
        'INSERT INTO usuarios (email, password, rol) VALUES ($1, $2, $3)',
        ['admin@admin.com', hashedPassword, 'admin']
      )
      console.log('✅ Usuario admin creado (email: admin@admin.com, pass: admin123)')
    } else {
      console.log('✅ Usuario admin ya existe')
    }
    
  } catch (error) {
    console.error('❌ Error al inicializar las tablas:', error)
    throw error
  } finally {
    client.release()
  }
}

export default pool