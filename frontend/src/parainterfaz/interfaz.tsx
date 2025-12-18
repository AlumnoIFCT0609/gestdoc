import React, { useState, useEffect } from 'react';
import './FormularioDinamico.css';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface Tutor {
  id?: number;
  nombre: string;
  email: string;
}

interface Curso {
  id?: number;
  titulo: string;
  descripcion: string;
  tutorId?: number;
}

interface Alumno {
  id?: number;
  nombre: string;
  edad: number;
  email: string;
  password: string;
  cursoId?: number;
}

interface FormData {
  tutor: Tutor;
  curso: Curso;
  alumno: Alumno;
}

interface ApiResponse {
  exito: boolean;
  mensaje: string;
  errores?: string[];
  idsGenerados?: { [tabla: string]: number };
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const FormularioDinamico: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    tutor: { nombre: '', email: '' },
    curso: { titulo: '', descripcion: '' },
    alumno: { nombre: '', edad: 0, email: '', password: '' }
  });

  const [tutoresExistentes, setTutoresExistentes] = useState<Tutor[]>([]);
  const [cursosExistentes, setCursosExistentes] = useState<Curso[]>([]);
  
  const [usarTutorExistente, setUsarTutorExistente] = useState(false);
  const [usarCursoExistente, setUsarCursoExistente] = useState(false);

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const API_URL = 'http://localhost:3000/api'; // Ajusta según tu configuración

  // ============================================================================
  // EFFECTS - CARGAR DATOS EXISTENTES
  // ============================================================================

  useEffect(() => {
    cargarTutores();
    cargarCursos();
  }, []);

  const cargarTutores = async () => {
    try {
      const response = await fetch(`${API_URL}/tutores`);
      if (response.ok) {
        const data = await response.json();
        setTutoresExistentes(data);
      }
    } catch (error) {
      console.error('Error al cargar tutores:', error);
    }
  };

  const cargarCursos = async () => {
    try {
      const response = await fetch(`${API_URL}/cursos`);
      if (response.ok) {
        const data = await response.json();
        setCursosExistentes(data);
      }
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    }
  };

  // ============================================================================
  // HANDLERS DE CAMBIOS
  // ============================================================================

  const handleTutorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      tutor: { ...prev.tutor, [name]: value }
    }));
  };

  const handleCursoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      curso: { ...prev.curso, [name]: value }
    }));
  };

  const handleAlumnoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      alumno: {
        ...prev.alumno,
        [name]: type === 'number' ? parseInt(value) || 0 : value
      }
    }));
  };

  const handleTutorExistenteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tutorId = parseInt(e.target.value);
    const tutor = tutoresExistentes.find(t => t.id === tutorId);
    if (tutor) {
      setFormData(prev => ({
        ...prev,
        tutor: tutor,
        curso: { ...prev.curso, tutorId: tutor.id }
      }));
    }
  };

  const handleCursoExistenteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cursoId = parseInt(e.target.value);
    const curso = cursosExistentes.find(c => c.id === cursoId);
    if (curso) {
      setFormData(prev => ({
        ...prev,
        curso: curso,
        alumno: { ...prev.alumno, cursoId: curso.id }
      }));
    }
  };

  // ============================================================================
  // VALIDACIONES
  // ============================================================================

  const validarFormulario = (): string[] => {
    const errores: string[] = [];

    // Validar Tutor
    if (!usarTutorExistente) {
      if (!formData.tutor.nombre.trim()) errores.push('El nombre del tutor es obligatorio');
      if (!formData.tutor.email.trim()) errores.push('El email del tutor es obligatorio');
      if (formData.tutor.email && !validarEmail(formData.tutor.email)) {
        errores.push('El email del tutor no es válido');
      }
    }

    // Validar Curso
    if (!usarCursoExistente) {
      if (!formData.curso.titulo.trim()) errores.push('El título del curso es obligatorio');
      if (!formData.curso.descripcion.trim()) errores.push('La descripción del curso es obligatoria');
    }

    // Validar Alumno
    if (!formData.alumno.nombre.trim()) errores.push('El nombre del alumno es obligatorio');
    if (!formData.alumno.email.trim()) errores.push('El email del alumno es obligatorio');
    if (formData.alumno.email && !validarEmail(formData.alumno.email)) {
      errores.push('El email del alumno no es válido');
    }
    if (!formData.alumno.password.trim()) errores.push('La contraseña es obligatoria');
    if (formData.alumno.password && formData.alumno.password.length < 6) {
      errores.push('La contraseña debe tener al menos 6 caracteres');
    }
    if (!formData.alumno.edad || formData.alumno.edad < 1) {
      errores.push('La edad del alumno debe ser mayor a 0');
    }

    return errores;
  };

  const validarEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // ============================================================================
  // SUBMIT
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar
    const errores = validarFormulario();
    if (errores.length > 0) {
      setMensaje({ tipo: 'error', texto: errores.join(', ') });
      return;
    }

    setLoading(true);
    setMensaje(null);

    try {
      // Preparar datos para el backend
      const payload = prepararPayload();
      
      const response = await fetch(`${API_URL}/formulario-dinamico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data: ApiResponse = await response.json();

      if (data.exito) {
        setMensaje({ tipo: 'success', texto: data.mensaje || '¡Registro exitoso!' });
        resetFormulario();
        // Recargar listas
        cargarTutores();
        cargarCursos();
      } else {
        setMensaje({ 
          tipo: 'error', 
          texto: data.errores?.join(', ') || 'Error al guardar los datos' 
        });
      }
    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        texto: 'Error de conexión con el servidor' 
      });
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepararPayload = () => {
    const tablas: string[] = [];
    const campos: any[] = [];
    const datos: any[] = [];

    // TUTOR
    if (!usarTutorExistente) {
      tablas.push('tutores');
      campos.push(
        { nombre: 'nombre', tipo: 'varchar', tabla: 'tutores' },
        { nombre: 'email', tipo: 'varchar', tabla: 'tutores' }
      );
      datos.push(
        { campo: 'nombre', tabla: 'tutores', valor: formData.tutor.nombre },
        { campo: 'email', tabla: 'tutores', valor: formData.tutor.email }
      );
    }

    // CURSO
    if (!usarCursoExistente) {
      tablas.push('cursos');
      campos.push(
        { nombre: 'titulo', tipo: 'varchar', tabla: 'cursos' },
        { nombre: 'descripcion', tipo: 'text', tabla: 'cursos' },
        { nombre: 'tutorId', tipo: 'number', tabla: 'cursos' }
      );
      datos.push(
        { campo: 'titulo', tabla: 'cursos', valor: formData.curso.titulo },
        { campo: 'descripcion', tabla: 'cursos', valor: formData.curso.descripcion }
      );
      
      if (usarTutorExistente && formData.curso.tutorId) {
        datos.push({ campo: 'tutorId', tabla: 'cursos', valor: formData.curso.tutorId });
      }
    }

    // ALUMNO
    tablas.push('alumnos');
    campos.push(
      { nombre: 'nombre', tipo: 'varchar', tabla: 'alumnos' },
      { nombre: 'edad', tipo: 'number', tabla: 'alumnos' },
      { nombre: 'email', tipo: 'varchar', tabla: 'alumnos' },
      { nombre: 'password', tipo: 'varchar', tabla: 'alumnos' },
      { nombre: 'cursoId', tipo: 'number', tabla: 'alumnos' }
    );
    datos.push(
      { campo: 'nombre', tabla: 'alumnos', valor: formData.alumno.nombre },
      { campo: 'edad', tabla: 'alumnos', valor: formData.alumno.edad },
      { campo: 'email', tabla: 'alumnos', valor: formData.alumno.email },
      { campo: 'password', tabla: 'alumnos', valor: formData.alumno.password }
    );

    if (usarCursoExistente && formData.alumno.cursoId) {
      datos.push({ campo: 'cursoId', tabla: 'alumnos', valor: formData.alumno.cursoId });
    }

    return { tablas, campos, datos };
  };

  const resetFormulario = () => {
    setFormData({
      tutor: { nombre: '', email: '' },
      curso: { titulo: '', descripcion: '' },
      alumno: { nombre: '', edad: 0, email: '', password: '' }
    });
    setUsarTutorExistente(false);
    setUsarCursoExistente(false);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="formulario-container">
      <div className="formulario-card">
        <h1>Registro de Alumno</h1>
        <p className="subtitulo">Complete la información del tutor, curso y alumno</p>

        {mensaje && (
          <div className={`mensaje ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ========== SECCIÓN TUTOR ========== */}
          <div className="seccion">
            <h2>👨‍🏫 Información del Tutor</h2>
            
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={usarTutorExistente}
                  onChange={(e) => setUsarTutorExistente(e.target.checked)}
                />
                Seleccionar tutor existente
              </label>
            </div>

            {usarTutorExistente ? (
              <div className="form-group">
                <label htmlFor="tutorExistente">Tutor *</label>
                <select
                  id="tutorExistente"
                  onChange={handleTutorExistenteChange}
                  required
                  className="form-control"
                >
                  <option value="">-- Seleccione un tutor --</option>
                  {tutoresExistentes.map(tutor => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.nombre} ({tutor.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="tutorNombre">Nombre del tutor *</label>
                  <input
                    type="text"
                    id="tutorNombre"
                    name="nombre"
                    value={formData.tutor.nombre}
                    onChange={handleTutorChange}
                    placeholder="Ej: Juan Pérez"
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tutorEmail">Email del tutor *</label>
                  <input
                    type="email"
                    id="tutorEmail"
                    name="email"
                    value={formData.tutor.email}
                    onChange={handleTutorChange}
                    placeholder="tutor@ejemplo.com"
                    className="form-control"
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* ========== SECCIÓN CURSO ========== */}
          <div className="seccion">
            <h2>📚 Información del Curso</h2>
            
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={usarCursoExistente}
                  onChange={(e) => setUsarCursoExistente(e.target.checked)}
                />
                Seleccionar curso existente
              </label>
            </div>

            {usarCursoExistente ? (
              <div className="form-group">
                <label htmlFor="cursoExistente">Curso *</label>
                <select
                  id="cursoExistente"
                  onChange={handleCursoExistenteChange}
                  required
                  className="form-control"
                >
                  <option value="">-- Seleccione un curso --</option>
                  {cursosExistentes.map(curso => (
                    <option key={curso.id} value={curso.id}>
                      {curso.titulo}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="cursoTitulo">Título del curso *</label>
                  <input
                    type="text"
                    id="cursoTitulo"
                    name="titulo"
                    value={formData.curso.titulo}
                    onChange={handleCursoChange}
                    placeholder="Ej: TypeScript Avanzado"
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cursoDescripcion">Descripción *</label>
                  <textarea
                    id="cursoDescripcion"
                    name="descripcion"
                    value={formData.curso.descripcion}
                    onChange={handleCursoChange}
                    placeholder="Descripción detallada del curso..."
                    className="form-control"
                    rows={4}
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* ========== SECCIÓN ALUMNO ========== */}
          <div className="seccion">
            <h2>🎓 Información del Alumno</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="alumnoNombre">Nombre del alumno *</label>
                <input
                  type="text"
                  id="alumnoNombre"
                  name="nombre"
                  value={formData.alumno.nombre}
                  onChange={handleAlumnoChange}
                  placeholder="Ej: María García"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="alumnoEdad">Edad *</label>
                <input
                  type="number"
                  id="alumnoEdad"
                  name="edad"
                  value={formData.alumno.edad || ''}
                  onChange={handleAlumnoChange}
                  placeholder="18"
                  min="1"
                  max="120"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="alumnoEmail">Email *</label>
              <input
                type="email"
                id="alumnoEmail"
                name="email"
                value={formData.alumno.email}
                onChange={handleAlumnoChange}
                placeholder="alumno@ejemplo.com"
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="alumnoPassword">Contraseña *</label>
              <input
                type="password"
                id="alumnoPassword"
                name="password"
                value={formData.alumno.password}
                onChange={handleAlumnoChange}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                className="form-control"
                required
              />
              <small>La contraseña será encriptada automáticamente</small>
            </div>
          </div>

          {/* ========== BOTONES ========== */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={resetFormulario}
              className="btn btn-secondary"
              disabled={loading}
            >
              Limpiar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Registrar Alumno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioDinamico;