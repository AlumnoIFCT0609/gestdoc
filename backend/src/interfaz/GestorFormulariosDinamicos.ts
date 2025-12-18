import { Pool } from 'pg';
import bcrypt from 'bcrypt';

// ============================================================================
// TIPOS Y ENUMS
// ============================================================================

export enum TipoCampo {
  NUMBER = 'number',
  TEXT = 'text',
  VARCHAR = 'varchar',
  BOOLEAN = 'boolean'
}

export interface DefinicionCampo {
  nombre: string;
  tipo: TipoCampo;
  tabla: string;
  esClaveForanea?: boolean;
  tablaReferenciada?: string;
}

export interface DatoFormulario {
  campo: string;
  tabla: string;
  valor: any;
}

export interface ResultadoInsercion {
  exito: boolean;
  mensaje: string;
  errores?: string[];
  idsGenerados?: { [tabla: string]: number };
}

// ============================================================================
// CLASE PRINCIPAL
// ============================================================================

export class GestorFormulariosDinamicos {
  private pool: Pool;
  private readonly SALT_ROUNDS = 10;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Método principal para procesar y guardar datos del formulario
   */
  async procesarFormulario(
    tablas: string[],
    campos: DefinicionCampo[],
    datos: DatoFormulario[]
  ): Promise<ResultadoInsercion> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Verificar y crear tablas si no existen
      for (const tabla of tablas) {
        await this.verificarYCrearTabla(client, tabla, campos);
      }

      // 2. Procesar campos con claves foráneas
      const camposConFK = this.detectarClavesForaneas(campos);

      // 3. Ordenar tablas según dependencias
      const tablasOrdenadas = this.ordenarTablasPorDependencias(tablas, camposConFK);

      // 4. Procesar y encriptar passwords
      const datosProcessados = await this.procesarDatos(datos);

      // 5. Insertar datos en orden
      const idsGenerados: { [tabla: string]: number } = {};
      
      for (const tabla of tablasOrdenadas) {
        const datosTabla = datosProcessados.filter(d => d.tabla === tabla);
        
        if (datosTabla.length > 0) {
          const id = await this.insertarEnTabla(
            client,
            tabla,
            datosTabla,
            camposConFK,
            idsGenerados
          );
          idsGenerados[tabla] = id;
        }
      }

      await client.query('COMMIT');

      return {
        exito: true,
        mensaje: 'Datos guardados correctamente',
        idsGenerados
      };

    } catch (error) {
      await client.query('ROLLBACK');
      return {
        exito: false,
        mensaje: 'Error al procesar el formulario',
        errores: [error instanceof Error ? error.message : String(error)]
      };
    } finally {
      client.release();
    }
  }

  /**
   * Verifica si una tabla existe, si no la crea con estructura base
   */
  private async verificarYCrearTabla(
    client: any,
    tabla: string,
    campos: DefinicionCampo[]
  ): Promise<void> {
    const existeTabla = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tabla]
    );

    if (!existeTabla.rows[0].exists) {
      const camposTabla = campos.filter(c => c.tabla === tabla);
      await this.crearTabla(client, tabla, camposTabla);
    } else {
      // Verificar y añadir columnas faltantes
      await this.verificarYAñadirColumnas(client, tabla, campos);
    }
  }

  /**
   * Crea una nueva tabla con campos automáticos y especificados
   */
  private async crearTabla(
    client: any,
    tabla: string,
    campos: DefinicionCampo[]
  ): Promise<void> {
    const columnas = ['id SERIAL PRIMARY KEY', 'fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP'];
    
    for (const campo of campos) {
      const tipoDB = this.mapearTipoAPostgres(campo.tipo);
      let definicion = `${campo.nombre} ${tipoDB}`;
      
      if (campo.esClaveForanea && campo.tablaReferenciada) {
        definicion += ` REFERENCES ${campo.tablaReferenciada}(id)`;
      }
      
      columnas.push(definicion);
    }

    const sql = `CREATE TABLE IF NOT EXISTS ${tabla} (${columnas.join(', ')})`;
    await client.query(sql);
  }

  /**
   * Verifica y añade columnas faltantes a una tabla existente
   */
  private async verificarYAñadirColumnas(
    client: any,
    tabla: string,
    campos: DefinicionCampo[]
  ): Promise<void> {
    const camposTabla = campos.filter(c => c.tabla === tabla);
    
    for (const campo of camposTabla) {
      const existeColumna = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = $2
        )`,
        [tabla, campo.nombre]
      );

      if (!existeColumna.rows[0].exists) {
        const tipoDB = this.mapearTipoAPostgres(campo.tipo);
        let sql = `ALTER TABLE ${tabla} ADD COLUMN ${campo.nombre} ${tipoDB}`;
        
        if (campo.esClaveForanea && campo.tablaReferenciada) {
          sql += ` REFERENCES ${campo.tablaReferenciada}(id)`;
        }
        
        await client.query(sql);
      }
    }
  }

  /**
   * Detecta claves foráneas por convención de nombres
   */
  private detectarClavesForaneas(campos: DefinicionCampo[]): DefinicionCampo[] {
    return campos.map(campo => {
      const nombreLower = campo.nombre.toLowerCase();
      
      if (nombreLower.endsWith('id') && nombreLower !== 'id') {
        const tablaRef = nombreLower.slice(0, -2); // Quitar 'id'
        return {
          ...campo,
          esClaveForanea: true,
          tablaReferenciada: tablaRef + 's' // Pluralizar (cursoId -> cursos)
        };
      }
      
      return campo;
    });
  }

  /**
   * Ordena tablas según sus dependencias de claves foráneas
   */
  private ordenarTablasPorDependencias(
    tablas: string[],
    campos: DefinicionCampo[]
  ): string[] {
    const dependencias = new Map<string, Set<string>>();
    
    // Construir grafo de dependencias
    for (const tabla of tablas) {
      dependencias.set(tabla, new Set());
      
      const camposTabla = campos.filter(c => c.tabla === tabla && c.esClaveForanea);
      for (const campo of camposTabla) {
        if (campo.tablaReferenciada && tablas.includes(campo.tablaReferenciada)) {
          dependencias.get(tabla)!.add(campo.tablaReferenciada);
        }
      }
    }

    // Ordenamiento topológico
    const ordenadas: string[] = [];
    const visitadas = new Set<string>();
    const enProceso = new Set<string>();

    const visitar = (tabla: string) => {
      if (visitadas.has(tabla)) return;
      if (enProceso.has(tabla)) {
        throw new Error(`Dependencia circular detectada en tabla: ${tabla}`);
      }

      enProceso.add(tabla);
      
      for (const dep of dependencias.get(tabla) || []) {
        visitar(dep);
      }
      
      enProceso.delete(tabla);
      visitadas.add(tabla);
      ordenadas.push(tabla);
    };

    for (const tabla of tablas) {
      visitar(tabla);
    }

    return ordenadas;
  }

  /**
   * Procesa datos incluyendo encriptación de passwords
   */
  private async procesarDatos(datos: DatoFormulario[]): Promise<DatoFormulario[]> {
    const procesados: DatoFormulario[] = [];

    for (const dato of datos) {
      const nombreCampo = dato.campo.toLowerCase();
      
      if (nombreCampo === 'password' || nombreCampo === 'contraseña') {
        const hash = await bcrypt.hash(dato.valor, this.SALT_ROUNDS);
        procesados.push({ ...dato, valor: hash });
      } else {
        procesados.push(dato);
      }
    }

    return procesados;
  }

  /**
   * Inserta datos en una tabla específica
   */
  private async insertarEnTabla(
    client: any,
    tabla: string,
    datos: DatoFormulario[],
    campos: DefinicionCampo[],
    idsGenerados: { [tabla: string]: number }
  ): Promise<number> {
    const columnas: string[] = [];
    const valores: any[] = [];
    const placeholders: string[] = [];

    for (let i = 0; i < datos.length; i++) {
      const dato = datos[i];
      const campo = campos.find(c => c.campo === dato.campo && c.tabla === tabla);
      
      // Si es clave foránea y ya tenemos el ID generado, usarlo
      if (campo?.esClaveForanea && campo.tablaReferenciada) {
        if (idsGenerados[campo.tablaReferenciada]) {
          columnas.push(dato.campo);
          valores.push(idsGenerados[campo.tablaReferenciada]);
          placeholders.push(`$${valores.length}`);
        }
      } else {
        columnas.push(dato.campo);
        valores.push(dato.valor);
        placeholders.push(`$${valores.length}`);
      }
    }

    const sql = `
      INSERT INTO ${tabla} (${columnas.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING id
    `;

    const result = await client.query(sql, valores);
    return result.rows[0].id;
  }

  /**
   * Mapea tipos personalizados a tipos de PostgreSQL
   */
  private mapearTipoAPostgres(tipo: TipoCampo): string {
    switch (tipo) {
      case TipoCampo.NUMBER:
        return 'NUMERIC';
      case TipoCampo.TEXT:
        return 'TEXT';
      case TipoCampo.VARCHAR:
        return 'VARCHAR(150)';
      case TipoCampo.BOOLEAN:
        return 'BOOLEAN';
      default:
        return 'VARCHAR(150)';
    }
  }

  /**
   * Método auxiliar para verificar si un registro existe
   */
  async existeRegistro(tabla: string, campo: string, valor: any): Promise<number | null> {
    const result = await this.pool.query(
      `SELECT id FROM ${tabla} WHERE ${campo} = $1 LIMIT 1`,
      [valor]
    );
    
    return result.rows.length > 0 ? result.rows[0].id : null;
  }
}

// ============================================================================
// EJEMPLO DE USO
// ============================================================================

/*
import { Pool } from 'pg';

// Configurar pool de conexiones
const pool = new Pool({
  user: 'tu_usuario',
  host: 'localhost',
  database: 'tu_base_datos',
  password: 'tu_password',
  port: 5432,
});

// Crear instancia del gestor
const gestor = new GestorFormulariosDinamicos(pool);

// Definir estructura
const tablas = ['tutores', 'cursos', 'alumnos'];

const campos: DefinicionCampo[] = [
  { nombre: 'nombre', tipo: TipoCampo.VARCHAR, tabla: 'tutores' },
  { nombre: 'email', tipo: TipoCampo.VARCHAR, tabla: 'tutores' },
  
  { nombre: 'titulo', tipo: TipoCampo.VARCHAR, tabla: 'cursos' },
  { nombre: 'descripcion', tipo: TipoCampo.TEXT, tabla: 'cursos' },
  { nombre: 'tutorId', tipo: TipoCampo.NUMBER, tabla: 'cursos' },
  
  { nombre: 'nombre', tipo: TipoCampo.VARCHAR, tabla: 'alumnos' },
  { nombre: 'edad', tipo: TipoCampo.NUMBER, tabla: 'alumnos' },
  { nombre: 'cursoId', tipo: TipoCampo.NUMBER, tabla: 'alumnos' },
  { nombre: 'password', tipo: TipoCampo.VARCHAR, tabla: 'alumnos' }
];

const datos: DatoFormulario[] = [
  { campo: 'nombre', tabla: 'tutores', valor: 'Juan Pérez' },
  { campo: 'email', tabla: 'tutores', valor: 'juan@ejemplo.com' },
  
  { campo: 'titulo', tabla: 'cursos', valor: 'TypeScript Avanzado' },
  { campo: 'descripcion', tabla: 'cursos', valor: 'Curso completo de TS' },
  
  { campo: 'nombre', tabla: 'alumnos', valor: 'María García' },
  { campo: 'edad', tabla: 'alumnos', valor: 25 },
  { campo: 'password', tabla: 'alumnos', valor: 'miPassword123' }
];

// Ejecutar
const resultado = await gestor.procesarFormulario(tablas, campos, datos);
console.log(resultado);
*/