// ============================================================================
// formularioDinamicoController.ts
// ============================================================================

import { Request, Response } from 'express';
import { pool } from './database'; // Ajusta la ruta según tu estructura
import { GestorFormulariosDinamicos, DefinicionCampo, DatoFormulario } from './GestorFormulariosDinamicos';

export class FormularioDinamicoController {
  private gestor: GestorFormulariosDinamicos;

  constructor() {
    this.gestor = new GestorFormulariosDinamicos(pool);
  }

  /**
   * Procesa el formulario dinámico completo
   */
  procesarFormulario = async (req: Request, res: Response) => {
    try {
      const { tablas, campos, datos } = req.body;

      // Validar que se reciban los datos necesarios
      if (!tablas || !Array.isArray(tablas) || tablas.length === 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debe proporcionar al menos una tabla',
          errores: ['El campo "tablas" es requerido y debe ser un array']
        });
      }

      if (!campos || !Array.isArray(campos) || campos.length === 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debe proporcionar la definición de campos',
          errores: ['El campo "campos" es requerido y debe ser un array']
        });
      }

      if (!datos || !Array.isArray(datos) || datos.length === 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Debe proporcionar los datos a insertar',
          errores: ['El campo "datos" es requerido y debe ser un array']
        });
      }

      // Procesar el formulario
      const resultado = await this.gestor.procesarFormulario(
        tablas as string[],
        campos as DefinicionCampo[],
        datos as DatoFormulario[]
      );

      // Devolver respuesta
      if (resultado.exito) {
        return res.status(201).json(resultado);
      } else {
        return res.status(400).json(resultado);
      }

    } catch (error) {
      console.error('Error en procesarFormulario:', error);
      return res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        errores: [error instanceof Error ? error.message : 'Error desconocido']
      });
    }
  };

  /**
   * Obtiene todos los tutores
   */
  obtenerTutores = async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, nombre, email FROM tutores ORDER BY nombre ASC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener tutores:', error);
      res.status(500).json({ 
        error: 'Error al obtener tutores',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * Obtiene todos los cursos
   */
  obtenerCursos = async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, titulo, descripcion, tutorId FROM cursos ORDER BY titulo ASC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener cursos:', error);
      res.status(500).json({ 
        error: 'Error al obtener cursos',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * Obtiene todos los alumnos
   */
  obtenerAlumnos = async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, nombre, email, edad, cursoId FROM alumnos ORDER BY nombre ASC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error al obtener alumnos:', error);
      res.status(500).json({ 
        error: 'Error al obtener alumnos',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * Busca un tutor por email
   */
  buscarTutorPorEmail = async (req: Request, res: Response) => {
    try {
      const { email } = req.params;
      
      const result = await pool.query(
        'SELECT id, nombre, email FROM tutores WHERE email = $1',
        [email]
      );

      if (result.rows.length > 0) {
        res.json(result.rows[0]);
      } else {
        res.status(404).json({ mensaje: 'Tutor no encontrado' });
      }
    } catch (error) {
      console.error('Error al buscar tutor:', error);
      res.status(500).json({ 
        error: 'Error al buscar tutor',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  /**
   * Busca un curso por título
   */
  buscarCursoPorTitulo = async (req: Request, res: Response) => {
    try {
      const { titulo } = req.params;
      
      const result = await pool.query(
        'SELECT id, titulo, descripcion, tutorId FROM cursos WHERE titulo ILIKE $1',
        [`%${titulo}%`]
      );

      res.json(result.rows);
    } catch (error) {
      console.error('Error al buscar curso:', error);
      res.status(500).json({ 
        error: 'Error al buscar curso',
        detalles: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };
}

// ============================================================================
// formularioDinamicoRoutes.ts
// ============================================================================

import { Router } from 'express';
import { FormularioDinamicoController } from './formularioDinamicoController';

const router = Router();
const controller = new FormularioDinamicoController();

// Ruta principal para procesar el formulario dinámico
router.post('/formulario-dinamico', controller.procesarFormulario);

// Rutas auxiliares para obtener datos existentes
router.get('/tutores', controller.obtenerTutores);
router.get('/cursos', controller.obtenerCursos);
router.get('/alumnos', controller.obtenerAlumnos);

// Rutas de búsqueda
router.get('/tutores/email/:email', controller.buscarTutorPorEmail);
router.get('/cursos/titulo/:titulo', controller.buscarCursoPorTitulo);

export default router;

// ============================================================================
// Integración en server.ts o app.ts
// ============================================================================

/*
import express from 'express';
import cors from 'cors';
import formularioDinamicoRoutes from './routes/formularioDinamicoRoutes';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api', formularioDinamicoRoutes);

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

export default app;
*/

// ============================================================================
// Ejemplo de estructura de directorios recomendada
// ============================================================================

/*
backend/
├── src/
│   ├── config/
│   │   └── database.ts              // Configuración de PostgreSQL
│   ├── controllers/
│   │   └── formularioDinamicoController.ts
│   ├── routes/
│   │   └── formularioDinamicoRoutes.ts
│   ├── services/
│   │   └── GestorFormulariosDinamicos.ts
│   ├── types/
│   │   └── index.ts                 // Tipos compartidos
│   └── server.ts                    // Archivo principal
├── package.json
└── tsconfig.json
*/