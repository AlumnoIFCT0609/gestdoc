import { useState, useEffect } from 'react'
import { useAuthFetch } from './hooks/useAuthFetch'

interface Usuario {
  id: number
  email: string
  rol: string
  ultima_entrada: string | null
  fecha_creacion: string
}

interface UsuariosProps {
  onCerrar: () => void
}

function Usuarios({ onCerrar }: UsuariosProps) {
  console.log('🔵 Componente Usuarios montado')
  const authFetch = useAuthFetch()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rol: 'admin'
  })
  const [editando, setEditando] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    try {
      const res = await authFetch('/api/usuarios')
      const data = await res.json()
      //setUsuarios(data)
      setUsuarios(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      setMensaje('Error al cargar usuarios')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editando) {
        // Actualizar usuario existente
        const res = await authFetch(`/api/usuarios/${editando}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!res.ok) {
          const error = await res.json()
          setMensaje(error.error || 'Error al actualizar usuario')
          setTimeout(() => setMensaje(''), 3000)
          return
        }
        
        setMensaje('✅ Usuario actualizado correctamente')
      } else {
        // Crear nuevo usuario
        const res = await authFetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!res.ok) {
          const error = await res.json()
          setMensaje(error.error || 'Error al crear usuario')
          setTimeout(() => setMensaje(''), 3000)
          return
        }
        
        setMensaje('✅ Usuario creado correctamente')
      }
      
      setFormData({ email: '', password: '', rol: 'admin' })
      setEditando(null)
      cargarUsuarios()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al guardar usuario')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const editar = (user: Usuario) => {
    setFormData({
      email: user.email,
      password: '', // Vacío porque es opcional al editar
      rol: user.rol
    })
    setEditando(user.id)
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return
    
    try {
      const res = await authFetch(`/api/usuarios/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
        setMensaje(data.error || '❌ Error al eliminar usuario')
        setTimeout(() => setMensaje(''), 3000)
        return
      }
      
      setMensaje('✅ Usuario eliminado correctamente')
      cargarUsuarios()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al eliminar usuario')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const cancelar = () => {
    setFormData({ email: '', password: '', rol: 'admin' })
    setEditando(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">👥 Gestión de Usuarios</h2>
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
              {editando ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="password"
                  placeholder={editando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editando}
                />
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="admin">Administrador</option>
                  <option value="tutor">Tutor</option>
                  <option value="alumno">Alumno</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm rounded transition font-medium"
                >
                  {editando ? '💾 Actualizar' : '➕ Crear Usuario'}
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Última Entrada</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Fecha Creación</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      📭 No hay usuarios registrados
                    </td>
                  </tr>
                ) : (
                  usuarios.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{user.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{user.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          user.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.rol === 'moderador' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {user.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.ultima_entrada 
                          ? new Date(user.ultima_entrada).toLocaleString('es-ES')
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(user.fecha_creacion).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <button
                          onClick={() => editar(user)}
                          className="text-blue-600 hover:text-blue-900 mr-3 text-lg"
                          title="Editar usuario"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => eliminar(user.id)}
                          className="text-red-600 hover:text-red-900 text-lg"
                          title="Eliminar usuario"
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

export default Usuarios