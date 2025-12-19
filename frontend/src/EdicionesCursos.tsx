import { useState, useEffect } from 'react'

interface EdicionCurso {
  id: number
  curso_id: number
  activo: boolean
  fecha_inicio: string
  fecha_fin: string
  tutor_id: number
  maximo_alumnos: number
  curso_descripcion?: string
  tutor_nombre?: string
  tutor_apellidos?: string
}

interface Curso {
  id: number
  codigo: string
  descripcion: string
  duracion_horas: number | null
}

interface Tutor {
  id: number
  nombre: string
  apellidos: string
}

interface EdicionesCursosProps {
  onCerrar: () => void
}

function EdicionesCursos({ onCerrar }: EdicionesCursosProps) {
  console.log('🔵 Componente EdicionesCursos montado')
  
  const [ediciones, setEdiciones] = useState<EdicionCurso[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [tutores, setTutores] = useState<Tutor[]>([])
  const [formData, setFormData] = useState({
    curso_id: '',
    activo: true,
    fecha_inicio: '',
    fecha_fin: '',
    tutor_id: '',
    maximo_alumnos:''
  })
  const [editando, setEditando] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [horasCalculadas, setHorasCalculadas] = useState<number>(0)
  const [errorHoras, setErrorHoras] = useState<string>('')

  useEffect(() => {
    cargarEdiciones()
    cargarCursos()
    cargarTutores()
  }, [])

  useEffect(() => {
    calcularHoras()
  }, [formData.fecha_inicio, formData.fecha_fin, formData.curso_id])

  const cargarEdiciones = async () => {
    try {
      const res = await fetch('/api/edicionescursos')
      const data = await res.json()
      
      // Cargar datos relacionados para mostrar en la tabla
      const edicionesConDetalles = await Promise.all(
        data.map(async (edicion: EdicionCurso) => {
          const [cursoRes, tutorRes] = await Promise.all([
            fetch(`/api/cursos/${edicion.curso_id}`),
            fetch(`/api/tutores/${edicion.tutor_id}`)
          ])
          
          const curso = await cursoRes.json()
          const tutor = await tutorRes.json()
          
          return {
            ...edicion,
            curso_descripcion: curso.descripcion,
            tutor_nombre: tutor.nombre,
            tutor_apellidos: tutor.apellidos
          }
        })
      )
      
      setEdiciones(edicionesConDetalles)
    } catch (error) {
      console.error('Error al cargar ediciones:', error)
      setMensaje('Error al cargar ediciones de cursos')
    }
  }

  const cargarCursos = async () => {
    try {
      const res = await fetch('/api/edicionescursos/selectores/cursos')
      const data = await res.json()
      setCursos(data)
    } catch (error) {
      console.error('Error al cargar cursos:', error)
    }
  }

  const cargarTutores = async () => {
    try {
      const res = await fetch('/api/edicionescursos/selectores/tutores')
      const data = await res.json()
      setTutores(data)
    } catch (error) {
      console.error('Error al cargar tutores:', error)
    }
  }

  const calcularHoras = () => {
    if (!formData.fecha_inicio || !formData.fecha_fin || !formData.curso_id) {
      setHorasCalculadas(0)
      setErrorHoras('')
      return
    }

    const cursoSeleccionado = cursos.find(c => c.id === parseInt(formData.curso_id))
    if (!cursoSeleccionado) return

    const inicio = new Date(formData.fecha_inicio + 'T00:00:00')
    const fin = new Date(formData.fecha_fin + 'T00:00:00')

    if (fin < inicio) {
      setErrorHoras('La fecha de fin debe ser posterior a la de inicio')
      setHorasCalculadas(0)
      return
    }

    let diasLaborables = 0
    let fechaActual = new Date(inicio)

    while (fechaActual <= fin) {
      const diaSemana = fechaActual.getDay()
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasLaborables++
      }
      fechaActual.setDate(fechaActual.getDate() + 1)
    }

    const horasTotales = diasLaborables * 5
    setHorasCalculadas(horasTotales)

    // Verificar si hay un curso seleccionado con duración
    const duracionCurso = cursoSeleccionado.duracion_horas || 0
    if (duracionCurso > 0) {
      const diferencia = Math.abs(horasTotales - duracionCurso)
      if (diferencia > 25) {
        setErrorHoras(`⚠️ Diferencia de ${diferencia} horas (máximo permitido: 25h)`)
      } else {
        setErrorHoras('')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (errorHoras && errorHoras.includes('⚠️')) {
      setMensaje('❌ La diferencia de horas excede el máximo permitido (25h)')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    try {
      if (editando) {
        const res = await fetch(`/api/edicionescursos/${editando}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!res.ok) {
          const error = await res.json()
          setMensaje(error.error || 'Error al actualizar edición')
          setTimeout(() => setMensaje(''), 3000)
          return
        }
        
        setMensaje('✅ Edición actualizada correctamente')
      } else {
        const res = await fetch('/api/edicionescursos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!res.ok) {
          const error = await res.json()
          setMensaje(error.error || 'Error al crear edición')
          setTimeout(() => setMensaje(''), 3000)
          return
        }
        
        setMensaje('✅ Edición creada correctamente')
      }
      
      setFormData({ curso_id: '', activo: true, fecha_inicio: '', fecha_fin: '', tutor_id: '', maximo_alumnos:'' })
      setEditando(null)
      setHorasCalculadas(0)
      setErrorHoras('')
      cargarEdiciones()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al guardar edición')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const editar = (edicion: EdicionCurso) => {

    const fechaInicio = edicion.fecha_inicio.substring(0, 10)
    const fechaFin = edicion.fecha_fin.substring(0, 10)
    
    setFormData({
      curso_id: edicion.curso_id.toString(),
      activo: edicion.activo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      tutor_id: edicion.tutor_id.toString(),
      maximo_alumnos: edicion.maximo_alumnos.toString()
    })
    setEditando(edicion.id)
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta edición de curso?')) return
    
    try {
      const res = await fetch(`/api/edicionescursos/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
        setMensaje(data.error || '❌ Error al eliminar edición')
        setTimeout(() => setMensaje(''), 3000)
        return
      }
      
      setMensaje('✅ Edición eliminada correctamente')
      cargarEdiciones()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al eliminar edición')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const cancelar = () => {
    setFormData({ curso_id: '', activo: true, fecha_inicio: '', fecha_fin: '', tutor_id: '', maximo_alumnos:'' })
    setEditando(null)
    setHorasCalculadas(0)
    setErrorHoras('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">📚 Gestión de Ediciones de Cursos</h2>
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
                : 'bg-green-100 border border-green-400 text-green-700'
            }`}>
              {mensaje}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              {editando ? '✏️ Editar Edición' : '➕ Nueva Edición de Curso'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Curso *</label>
                  <select
                    value={formData.curso_id}
                    onChange={(e) => setFormData({ ...formData, curso_id: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar curso...</option>
                    {cursos.map((curso) => (
                      <option key={curso.id} value={curso.id}>
                        {curso.codigo} - {curso.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutor *</label>
                  <select
                    value={formData.tutor_id}
                    onChange={(e) => setFormData({ ...formData, tutor_id: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar tutor...</option>
                    {tutores.map((tutor) => (
                      <option key={tutor.id} value={tutor.id}>
                        {tutor.nombre} {tutor.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Activo</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio *</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin *</label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximo Alumnos</label>
                  <input
                    type="number"
                    value={formData.maximo_alumnos}
                    onChange={(e) => setFormData({ ...formData, maximo_alumnos: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horas Calculadas</label>
                  <div className={`w-full border rounded px-3 py-2 text-sm font-semibold ${
                    errorHoras && errorHoras.includes('⚠️') 
                      ? 'bg-red-50 border-red-300 text-red-700' 
                      : 'bg-blue-50 border-blue-300 text-blue-700'
                  }`}>
                    {horasCalculadas} horas
                  </div>
                  {errorHoras && (
                    <p className={`text-xs mt-1 ${
                      errorHoras.includes('⚠️') ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {errorHoras}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm rounded transition font-medium"
                >
                  {editando ? '💾 Actualizar' : '➕ Crear Edición'}
                </button>
                {editando && (
                  <button
                    type="button"
                    onClick={cancelar}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 text-sm rounded transition font-medium"
                  >
                    ❌ Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Curso</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Tutor</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Fecha Inicio</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Fecha Fin</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Activo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">MaximoAlumnos</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ediciones.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      📭 No hay ediciones registradas
                    </td>
                  </tr>
                ) : (
                  ediciones.map((edicion) => (
                    <tr key={edicion.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{edicion.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{edicion.curso_descripcion}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {edicion.tutor_nombre} {edicion.tutor_apellidos}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(edicion.fecha_inicio).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(edicion.fecha_fin).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={edicion.activo} readOnly />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {edicion.maximo_alumnos.toString()}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <button
                          onClick={() => editar(edicion)}
                          className="text-blue-600 hover:text-blue-900 mr-3 text-lg"
                          title="Editar edición"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => eliminar(edicion.id)}
                          className="text-red-600 hover:text-red-900 text-lg"
                          title="Eliminar edición"
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
      </div>
    </div>
  )
}

export default EdicionesCursos