import { useState, useEffect } from 'react'
import { useAuthFetch } from './hooks/useAuthFetch'

interface Matricula {
  id: number
  ediciones_cursos_id: number
  activo: boolean
  alumno_id: number
  alumno_nombre?: string
  alumno_apellidos?: string
}

interface EdicionCurso {
  id: number
  curso_id: number
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  tutor_id: number
  maximo_alumnos?: number
}

interface Alumno {
  id: number
  nombre: string
  apellidos: string
}

interface MatriculasAlumnosProps {
  onCerrar: () => void
}

function MatriculasAlumnos({ onCerrar }: MatriculasAlumnosProps) {
  console.log('🔵 Componente MatriculasAlumnos montado')
  const authFetch = useAuthFetch()
  const [edicionSeleccionada, setEdicionSeleccionada] = useState<string>('')
  const [ediciones, setEdiciones] = useState<EdicionCurso[]>([])
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<number[]>([])
  const [matriculas, setMatriculas] = useState<Matricula[]>([])
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [edicionInfo, setEdicionInfo] = useState<EdicionCurso | null>(null)

  useEffect(() => {
    cargarEdiciones()
    cargarAlumnos()
  }, [])

  useEffect(() => {
    if (edicionSeleccionada) {
      cargarMatriculas()
      cargarInfoEdicion()
    } else {
      setMatriculas([])
      setEdicionInfo(null)
    }
    setAlumnosSeleccionados([])
  }, [edicionSeleccionada])

  const cargarEdiciones = async () => {
    try {
      const res = await authFetch('/api/matriculasalumnos/selectores/edicionescursos')
      const data = await res.json()
      setEdiciones(data)
    } catch (error) {
      console.error('Error al cargar ediciones:', error)
    }
  }

  const cargarAlumnos = async () => {
    try {
      const res = await authFetch('/api/matriculasalumnos/selectores/alumnos')
      const data = await res.json()
      setAlumnos(data)
    } catch (error) {
      console.error('Error al cargar alumnos:', error)
    }
  }

  const cargarInfoEdicion = async () => {
    if (!edicionSeleccionada) return
    
    try {
      const res = await authFetch(`/api/edicionescursos/${edicionSeleccionada}`)
      const data = await res.json()
      setEdicionInfo(data)
    } catch (error) {
      console.error('Error al cargar info de edición:', error)
    }
  }

  const cargarMatriculas = async () => {
    if (!edicionSeleccionada) return
    
    try {
      const res = await authFetch('/api/matriculasalumnos')
      const data = await res.json()
      
      // Filtrar por edición seleccionada
      const matriculasFiltradas = data.filter(
        (m: Matricula) => m.ediciones_cursos_id === parseInt(edicionSeleccionada)
      )
      
      // Cargar datos de alumnos
      const matriculasConDetalles = await Promise.all(
        matriculasFiltradas.map(async (matricula: Matricula) => {
          const alumnoRes = await authFetch(`/api/alumnos/${matricula.alumno_id}`)
          const alumno = await alumnoRes.json()
          
          return {
            ...matricula,
            alumno_nombre: alumno.nombre,
            alumno_apellidos: alumno.apellidos
          }
        })
      )
      
      setMatriculas(matriculasConDetalles)
    } catch (error) {
      console.error('Error al cargar matrículas:', error)
    }
  }

  const verificarConflictos = async (alumnoId: number): Promise<string | null> => {
    if (!edicionInfo) return null
    
    try {
      // Obtener todas las matrículas del alumno
      const resMatriculas = await authFetch('/api/matriculasalumnos')
      const todasMatriculas = await resMatriculas.json()
      
      const matriculasAlumno = todasMatriculas.filter(
        (m: Matricula) => m.alumno_id === alumnoId && m.activo
      )
      
      // Verificar conflictos con otras ediciones
      for (const matricula of matriculasAlumno) {
        if (matricula.ediciones_cursos_id === parseInt(edicionSeleccionada)) continue
        
        const resEdicion = await authFetch(`/api/edicionescursos/${matricula.ediciones_cursos_id}`)
        const edicion = await resEdicion.json()
        
        // Verificar si es la misma fecha de inicio, fecha fin y mismo tutor
        if (
          edicion.fecha_inicio === edicionInfo.fecha_inicio &&
          edicion.fecha_fin === edicionInfo.fecha_fin &&
          edicion.tutor_id === edicionInfo.tutor_id
        ) {
          const alumno = alumnos.find(a => a.id === alumnoId)
          return `${alumno?.nombre} ${alumno?.apellidos} ya está matriculado en otra edición con las mismas fechas y tutor`
        }
      }
      
      return null
    } catch (error) {
      console.error('Error al verificar conflictos:', error)
      return null
    }
  }

  const handleToggleAlumno = (alumnoId: number) => {
    setAlumnosSeleccionados(prev => {
      if (prev.includes(alumnoId)) {
        return prev.filter(id => id !== alumnoId)
      } else {
        return [...prev, alumnoId]
      }
    })
  }

  const handleToggleTodos = () => {
    const alumnosDisponibles = getAlumnosDisponibles()
    if (alumnosSeleccionados.length === alumnosDisponibles.length) {
      setAlumnosSeleccionados([])
    } else {
      setAlumnosSeleccionados(alumnosDisponibles.map(a => a.id))
    }
  }

  const getAlumnosDisponibles = () => {
    const idsMatriculados = matriculas.map(m => m.alumno_id)
    return alumnos.filter(alumno => !idsMatriculados.includes(alumno.id))
  }

  const handleMatricular = async () => {
    if (!edicionSeleccionada) {
      setMensaje('❌ Selecciona una edición de curso')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    if (alumnosSeleccionados.length === 0) {
      setMensaje('❌ Selecciona al menos un alumno')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    // Verificar límite de alumnos
    const maximoAlumnos = edicionInfo?.maximo_alumnos || 0
    if (maximoAlumnos > 0) {
      const totalDespuesMatricula = matriculas.length + alumnosSeleccionados.length
      if (totalDespuesMatricula > maximoAlumnos) {
        setMensaje(`❌ Excede el máximo de alumnos permitidos (${maximoAlumnos}). Actual: ${matriculas.length}, Intentando agregar: ${alumnosSeleccionados.length}`)
        setTimeout(() => setMensaje(''), 5000)
        return
      }
    }

    setCargando(true)
    let errores: string[] = []
    let exitosos = 0

    for (const alumnoId of alumnosSeleccionados) {
      try {
        // Verificar conflictos
        const conflicto = await verificarConflictos(alumnoId)
        if (conflicto) {
          errores.push(conflicto)
          continue
        }

        const res = await authFetch('/api/matriculasalumnos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ediciones_cursos_id: parseInt(edicionSeleccionada),
            activo: true,
            alumno_id: alumnoId
          })
        })

        if (!res.ok) {
          const error = await res.json()
          const alumno = alumnos.find(a => a.id === alumnoId)
          errores.push(`${alumno?.nombre} ${alumno?.apellidos}: ${error.error}`)
        } else {
          exitosos++
        }
      } catch (error) {
        const alumno = alumnos.find(a => a.id === alumnoId)
        errores.push(`${alumno?.nombre} ${alumno?.apellidos}: Error al matricular`)
      }
    }

    setCargando(false)
    
    if (exitosos > 0) {
      setMensaje(`✅ ${exitosos} alumno(s) matriculado(s) correctamente`)
      setAlumnosSeleccionados([])
      cargarMatriculas()
    }
    
    if (errores.length > 0) {
      setTimeout(() => {
        setMensaje(`⚠️ Errores: ${errores.join(' | ')}`)
      }, exitosos > 0 ? 3000 : 0)
    }
    
    setTimeout(() => setMensaje(''), 8000)
  }

  const toggleActivo = async (id: number, matricula: Matricula) => {
    try {
      const res = await authFetch(`/api/matriculasalumnos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ediciones_cursos_id: matricula.ediciones_cursos_id,
          activo: !matricula.activo,
          alumnos_id: matricula.alumno_id
        })
      })

      if (!res.ok) {
        const error = await res.json()
        setMensaje(error.error || '❌ Error al actualizar estado')
        setTimeout(() => setMensaje(''), 3000)
        return
      }

      setMensaje('✅ Estado actualizado')
      cargarMatriculas()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al actualizar estado')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const eliminarMatricula = async (id: number, nombreCompleto: string) => {
    if (!confirm(`¿Seguro que deseas eliminar la matrícula de ${nombreCompleto}?`)) return

    try {
      const res = await authFetch(`/api/matriculasalumnos/${id}`, { method: 'DELETE' })
      
      if (!res.ok) {
        const error = await res.json()
        setMensaje(error.error || '❌ Error al eliminar matrícula')
        setTimeout(() => setMensaje(''), 3000)
        return
      }

      setMensaje('✅ Matrícula eliminada correctamente')
      cargarMatriculas()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al eliminar matrícula')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const alumnosDisponibles = getAlumnosDisponibles()
  const todosSeleccionados = alumnosDisponibles.length > 0 && 
    alumnosSeleccionados.length === alumnosDisponibles.length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-800">🎓 Matrícula de Alumnos</h2>
          <button
            onClick={onCerrar}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {mensaje && (
            <div className={`mb-4 p-3 rounded text-sm font-medium ${
              mensaje.includes('❌') || mensaje.includes('Error')
                ? 'bg-red-100 border border-red-400 text-red-700'
                : mensaje.includes('⚠️')
                ? 'bg-yellow-100 border border-yellow-400 text-yellow-700'
                : 'bg-green-100 border border-green-400 text-green-700'
            }`}>
              {mensaje}
            </div>
          )}

          {/* Selección de Edición */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              📚 Paso 1: Selecciona la Edición del Curso
            </h3>
            <select
              value={edicionSeleccionada}
              onChange={(e) => setEdicionSeleccionada(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar edición de curso...</option>
              {ediciones.map((edicion) => (
                <option key={edicion.id} value={edicion.id}>
                  {edicion.descripcion} - {new Date(edicion.fecha_inicio).toLocaleDateString('es-ES')} a {new Date(edicion.fecha_fin).toLocaleDateString('es-ES')}
                </option>
              ))}
            </select>
            
            {edicionInfo && edicionInfo.maximo_alumnos && (
              <div className="mt-2 text-sm text-gray-600">
                📊 Plazas: {matriculas.length} / {edicionInfo.maximo_alumnos} ocupadas
              </div>
            )}
          </div>

          {/* Lista de Alumnos Disponibles */}
          {edicionSeleccionada && (
            <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-700">
                  👥 Paso 2: Selecciona Alumnos para Matricular
                </h3>
                {alumnosDisponibles.length > 0 && (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={todosSeleccionados}
                      onChange={handleToggleTodos}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Seleccionar todos</span>
                  </label>
                )}
              </div>

              {alumnosDisponibles.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  ✅ Todos los alumnos activos ya están matriculados en esta edición
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-white rounded border border-gray-200">
                    {alumnosDisponibles.map((alumno) => (
                      <label
                        key={alumno.id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-300 transition"
                      >
                        <input
                          type="checkbox"
                          checked={alumnosSeleccionados.includes(alumno.id)}
                          onChange={() => handleToggleAlumno(alumno.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          {alumno.apellidos}, {alumno.nombre}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {alumnosSeleccionados.length} alumno(s) seleccionado(s)
                    </span>
                    <button
                      onClick={handleMatricular}
                      disabled={cargando || alumnosSeleccionados.length === 0}
                      className={`px-6 py-2 rounded font-medium transition ${
                        cargando || alumnosSeleccionados.length === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {cargando ? '⏳ Matriculando...' : '✅ Matricular Seleccionados'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tabla de Alumnos Matriculados */}
          {edicionSeleccionada && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">
                📋 Alumnos Matriculados ({matriculas.length})
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Apellidos y Nombre</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {matriculas.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                          📭 No hay alumnos matriculados en esta edición
                        </td>
                      </tr>
                    ) : (
                      matriculas.map((matricula) => (
                        <tr key={matricula.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{matricula.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {matricula.alumno_apellidos}, {matricula.alumno_nombre}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleActivo(matricula.id, matricula)}
                              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                                matricula.activo
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              {matricula.activo ? '✓ Activo' : '✗ Inactivo'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <button
                              onClick={() => eliminarMatricula(
                                matricula.id, 
                                `${matricula.alumno_nombre} ${matricula.alumno_apellidos}`
                              )}
                              className="text-red-600 hover:text-red-900 text-lg"
                              title="Eliminar matrícula"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MatriculasAlumnos