import { useState, useEffect } from 'react'
import { useAuthFetch } from './hooks/useAuthFetch'

interface Curso {
  id: number
  codigo: string
  descripcion: string
  duracion_horas: number | null
  observaciones: string | null
  nivel: number | null
  activo:boolean
  fecha_creacion: string
}

interface CursosProps {
  onCerrar: () => void
}

function Cursos({ onCerrar }: CursosProps) {
  console.log('🔵 Componente Cursos montado')
  const authFetch = useAuthFetch()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    duracion_horas: '',
    observaciones:'',
    nivel:'',
    activo:true
  })
  const [editando, setEditando] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarCursos()
  }, [])

  const cargarCursos = async () => {
    try {
      const res = await authFetch('/api/Cursos')
      const data = await res.json()
      setCursos(data)
    } catch (error) {
      console.error('Error al cargar cursos:', error)
      setMensaje('Error al cargar cursos')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editando) {
        // Actualizar curso existente
        const res = await authFetch(`/api/cursos/${editando}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!res.ok) {
          const error = await res.json()
          setMensaje(error.error || 'Error al actualizar curso')
          setTimeout(() => setMensaje(''), 3000)
          return
        }
        
        setMensaje('✅ Curso actualizado correctamente')
      } else {
        // Crear nuevo curso
        const res = await authFetch('/api/cursos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!res.ok) {
          const error = await res.json()
          setMensaje(error.error || 'Error al crear curso')
          setTimeout(() => setMensaje(''), 3000)
          return
        }
        
        setMensaje('✅ Curso creado correctamente')
      }
      
      setFormData({ codigo: '', descripcion: '', duracion_horas: '', observaciones:'', nivel:'',activo:true })
      setEditando(null)
      cargarCursos()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al guardar curso')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const editar = (curso: Curso) => {
    setFormData({
      codigo: curso.codigo,
      descripcion: curso.descripcion,
      duracion_horas: curso.duracion_horas?.toString() || '',  
      observaciones: curso.observaciones|| '',
      nivel: curso.nivel?.toString() || '',
      activo: curso.activo
    })
    setEditando(curso.id)
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este curso?')) return
    
    try {
      const res = await fetch(`/api/cursos/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
        setMensaje(data.error || '❌ Error al eliminar curso')
        setTimeout(() => setMensaje(''), 3000)
        return
      }
      
      setMensaje('✅ Curso eliminado correctamente')
      cargarCursos()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al eliminar curso')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const cancelar = () => {
    setFormData({ codigo: '', descripcion: '', duracion_horas: '', observaciones:'', nivel:'', activo:true })
    setEditando(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">👥 Gestión de Cursos</h2>
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
              {editando ? '✏️ Editar Curso' : '➕ Nuevo Curso'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder= "descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                />
                <input
                  type="text"
                  placeholder= "duracion_horas"
                  value={formData.duracion_horas}
                  onChange={(e) => setFormData({ ...formData, duracion_horas: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                />
                <input
                  type="text"
                  placeholder= "observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                />
                <input
                  type="text"
                  placeholder= "nivel"
                  value={formData.nivel}
                  onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                />
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                  
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm rounded transition font-medium"
                >
                  {editando ? '💾 Actualizar' : '➕ Crear Curso'}
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Codigo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Descripcion</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Duracion(horas)</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Observaciones</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Nivel</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Activo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Fecha Creación</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cursos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      📭 No hay cursos registrados
                    </td>
                  </tr>
                ) : (
                  cursos.map((curso) => (
                    <tr key={curso.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{curso.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{curso.codigo}</td>
                      <td className="px-4 py-3 text-sm">{curso.descripcion}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{curso.duracion_horas ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{curso.observaciones ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{curso.nivel ?? '—'}</td>
                      <td className="h-5 w-5">
                            <input type="checkbox" checked={curso.activo} readOnly/>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(curso.fecha_creacion).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <button
                          onClick={() => editar(curso)}
                          className="text-blue-600 hover:text-blue-900 mr-3 text-lg"
                          title="Editar curso"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => eliminar(curso.id)}
                          className="text-red-600 hover:text-red-900 text-lg"
                          title="Eliminar curso"
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

export default Cursos