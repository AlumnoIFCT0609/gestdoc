import { useState, useEffect } from 'react'
import { useAuthFetch } from './hooks/useAuthFetch'

interface Tutor {
  id: number
  nombre: string
  apellidos: string | null
  dni: string  | null
  email:string
  tlf: string  | null
  especialidad: string | null
  observaciones: string | null
  activo: boolean
  fecha_creacion: string
}

interface TutoresProps {
  onCerrar: () => void
}

function Tutores({ onCerrar }: TutoresProps) {
  console.log('🔵 Componente Tutores montado')
  const authFetch = useAuthFetch()
  const [tutores, setTutores] = useState<Tutor[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni:'',
    email:'',
    tlf:'',
    especialidad: '',
    observaciones:'',
    activo:true
  })
  const [editando, setEditando] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarTutores()
  }, [])

  const cargarTutores = async () => {
    try {
      const res = await authFetch('/api/tutores')
       if (!res.ok) {
          setMensaje('❌ Error al cargar tutores')
        return
        }
      const data = await res.json()
      setTutores(Array.isArray(data) ? data : []) 

      setTutores(data)
    } catch (error) {
      console.error('Error al cargar tutores:', error)
      setMensaje('Error al cargar tutores')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editando) {
        // Actualizar Tutor existente
        const res = await authFetch(`/api/tutores/${editando}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!res.ok) {
          const error = await res.json()
          setMensaje(error.error || 'Error al actualizar tutor')
          setTimeout(() => setMensaje(''), 3000)
          return
        }
        
        setMensaje('✅ Tutor actualizado correctamente')
      } else {
        // Crear nuevo Tutor
        const res = await authFetch('/api/tutores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!res.ok) {
          const error = await res.json()
          setMensaje(error.error || 'Error al crear tutor')
          setTimeout(() => setMensaje(''), 3000)
          return
        }
        
        setMensaje('✅ Tutor creado correctamente')
      }
      
      setFormData({nombre: '',
                apellidos: '',
                dni:'',
                email:'',
                tlf:'',
                especialidad: '',
                observaciones:'',
                activo:true })

      setEditando(null)
      cargarTutores()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al guardar tutor')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const editar = (tutor: Tutor) => {
    setFormData({
      nombre: tutor.nombre,
      apellidos: tutor.apellidos || '',
      dni: tutor.dni || '',  
      email: tutor.email || '',
      tlf: tutor.tlf || '',
      especialidad: tutor.especialidad || '',
      observaciones: tutor.observaciones|| '',
      activo: tutor.activo
    })
    setEditando(tutor.id)
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este tutor?')) return
    
    try {
      const res = await authFetch(`/api/tutores/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
        setMensaje(data.error || '❌ Error al eliminar tutor')
        setTimeout(() => setMensaje(''), 3000)
        return
      }
      
      setMensaje('✅ Tutor eliminado correctamente')
      cargarTutores()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al eliminar Tutor')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const cancelar = () => {
    setFormData({ nombre: '',
                apellidos: '',
                dni:'',
                email:'',
                tlf:'',
                especialidad: '',
                observaciones:'',
                activo:true})
    setEditando(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">👥 Gestión de Tutores</h2>
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
              {editando ? '✏️ Editar Tutor' : '➕ Nuevo Tutor'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder= "apellidos"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                />
                <input
                  type="text"
                  placeholder= "dni"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                />
                <input
                  type="email"
                  placeholder= "email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                />
                <input
                  type="tlf"
                  placeholder= "tlf"
                  value={formData.tlf}
                  onChange={(e) => setFormData({ ...formData, tlf: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                />
                <select
                  value={formData.especialidad}
                  onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                > <option value="">elige opcion</option>
                  <option value="informatica">Informática</option>
                  <option value="ingles">Inglés</option>
                  <option value="apoyo">Apoyo Escolar</option>
                  <option value="calidad">Calidad</option>
                  <option value="administración">Administracion</option>
                </select>
                <input
                  type="text"
                  placeholder= "observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full md:col-span-3 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  {editando ? '💾 Actualizar' : '➕ Crear Tutor'}
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Apellidos</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Dni</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Tlf</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Especialidad</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Observaciones</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Activo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Fecha Creación</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tutores.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      📭 No hay tutores registrados
                    </td>
                  </tr>
                ) : (
                  tutores.map((tutor) => (
                    <tr key={tutor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{tutor.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{tutor.nombre}</td>
                      <td className="px-4 py-3 text-sm">{tutor.apellidos ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tutor.dni ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">{tutor.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tutor.tlf ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tutor.especialidad ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{tutor.observaciones ?? '—'}</td>
                      <td className="h-5 w-5">
                            <input type="checkbox" checked={tutor.activo} readOnly/>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(tutor.fecha_creacion).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <button
                          onClick={() => editar(tutor)}
                          className="text-blue-600 hover:text-blue-900 mr-3 text-lg"
                          title="Editar tutor"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => eliminar(tutor.id)}
                          className="text-red-600 hover:text-red-900 text-lg"
                          title="Eliminar tutor"
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

export default Tutores