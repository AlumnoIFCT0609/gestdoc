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
        activo BOOLEAN default true,
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
        activo BOOLEAN default true,
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
        nivel INTEGER,
        activo BOOLEAN default true,
        observaciones TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tabla "cursos" lista')

       // Tabla de Tutores
    await client.query(`
      CREATE TABLE IF NOT EXISTS tutores (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(25)  NOT NULL,
        apellidos VARCHAR(25),
        dni VARCHAR(15) ,
        email VARCHAR(80) UNIQUE NOT NULL,
        tlf VARCHAR(80),
        activo BOOLEAN default true,
        especialidad VARCHAR(155),
        observaciones TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tabla "tutores" lista')

  // Tabla de Alumnos
    await client.query(`
      CREATE TABLE IF NOT EXISTS alumnos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(25)  NOT NULL,
        apellidos VARCHAR(25),
        dni VARCHAR(15) ,
        email VARCHAR(80) UNIQUE NOT NULL,
        tlf VARCHAR(80),
        grupo VARCHAR(155),
        activo BOOLEAN default true,
        observaciones TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Tabla "tutores" lista')
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