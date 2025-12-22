import { useState, useEffect } from 'react'
import { useAuthFetch } from './hooks/useAuthFetch'

interface Alumno {
  id: number
  nombre: string
  apellidos: string | null
  dni: string  | null
  email:string
  tlf: string  | null
  grupo: string | null
  observaciones: string | null
  activo: boolean
  fecha_creacion: string
}

interface AlumnosProps {
  onCerrar: () => void
}

function Alumnos({ onCerrar }: AlumnosProps) {
  console.log('🔵 Componente Alumnos montado')
  const authFetch = useAuthFetch()
  
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni:'',
    email:'',
    tlf:'',
    grupo: '',
    observaciones:'',
    activo:true
  })
  const [editando, setEditando] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarAlumnos()
  }, [])

  const cargarAlumnos = async () => {
    try {
     // const res = await fetch('/api/alumnos')
      const res = await authFetch('/api/alumnos')
        if (!res.ok) {
          setMensaje('❌ Error al cargar alumnos')
        return
        }
      const data = await res.json()
       setAlumnos(Array.isArray(data) ? data : []) 
      //setAlumnos(data)
    } catch (error) {

      console.error('Error al cargar alumnos:', error)
      setMensaje('Error al cargar alumnos')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editando) {
        // Actualizar alumno existente
        const res = await authFetch(`/api/alumnos/${editando}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!res.ok) {
          const error = await res.json()
          setMensaje(error.error || 'Error al actualizar alumno')
          setTimeout(() => setMensaje(''), 3000)
          return
        }
        
        setMensaje('✅ Alumno actualizado correctamente')
      } else {
        // Crear nuevo alumnoo
        const res = await authFetch('/api/alumnos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        
        if (!res.ok) {
          const error = await res.json()
          setMensaje(error.error || 'Error al crear alumno')
          setTimeout(() => setMensaje(''), 3000)
          return
        }
        
        setMensaje('✅ Alumno creado correctamente')
      }
      
      setFormData({nombre: '',
                apellidos: '',
                dni:'',
                email:'',
                tlf:'',
                grupo: '',
                observaciones:'',
                activo:true })

      setEditando(null)
      cargarAlumnos()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al guardar alumno')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const editar = (alumno: Alumno) => {
    setFormData({
      nombre: alumno.nombre,
      apellidos: alumno.apellidos || '',
      dni: alumno.dni || '',  
      email: alumno.email || '',
      tlf: alumno.tlf || '',
      grupo: alumno.grupo || '',
      observaciones: alumno.observaciones|| '',
      activo: alumno.activo
    })
    setEditando(alumno.id)
  }
  const crearUsuario = async (id: number) => {
  if (!confirm('¿Seguro que deseas crear usuario para este alumno?')) return
  
  try {
    // 1. Obtener los datos del alumno
    const resAlumno = await authFetch(`/api/alumnos/${id}`)
    const alumno = await resAlumno.json()
    
    if (!alumno.email) {
      setMensaje('❌ El alumno no tiene email registrado')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    
    // 2. Verificar si ya existe un usuario con ese email
    const resUsuarios = await authFetch('/api/usuarios')
    const usuarios = await resUsuarios.json()
    
    const usuarioExistente = usuarios.find((u: any) => u.email === alumno.email)
    
    if (usuarioExistente) {
      setMensaje('⚠️ Ya existe un usuario con ese email')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    
    // 3. Crear el nuevo usuario
    const nuevoUsuario = {
      email: alumno.email,
      password: alumno.dni,
      rol: 'Alumno',
      activo: true
    }
    
    const resCrear = await authFetch('/api/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(nuevoUsuario)
    })
    
    if (resCrear.ok) {
      setMensaje('✅ Usuario creado exitosamente')
      setTimeout(() => setMensaje(''), 3000)
    } else {
      const error = await resCrear.json()
      setMensaje(`❌ Error: ${error.message || 'No se pudo crear el usuario'}`)
      setTimeout(() => setMensaje(''), 3000)
    }
    
  } catch (error) {
    console.error('Error:', error)
    setMensaje('❌ Error al crear usuario para el alumno')
    setTimeout(() => setMensaje(''), 3000)
  }
}

  const eliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este alumno?')) return
    
    try {
      const res = await authFetch(`/api/alumnos/${id}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (!res.ok) {
        setMensaje(data.error || '❌ Error al eliminar alumno')
        setTimeout(() => setMensaje(''), 3000)
        return
      }
      
      setMensaje('✅ Alumno eliminado correctamente')
      cargarAlumnos()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      console.error('Error:', error)
      setMensaje('❌ Error al eliminar Alumnos')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const cancelar = () => {
    setFormData({ nombre: '',
                apellidos: '',
                dni:'',
                email:'',
                tlf:'',
                grupo: '',
                observaciones:'',
                activo:true})
    setEditando(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">👥 Gestión de Alumnos</h2>
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
              {editando ? '✏️ Editar Alumno' : '➕ Nuevo Alumno'}
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
                  value={formData.grupo}
                  onChange={(e) => setFormData({ ...formData, grupo: e.target.value })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  
                >
                  <option value="desempleados">Desempleados</option>
                  <option value="ocupados">Trabajadores</option>
                  <option value="empresa">Curso a empresa</option>
                  <option value="jovenes">Jovenes</option>
                  <option value="mayores">Mayores</option>
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
                  {editando ? '💾 Actualizar' : '➕ Crear Alumno'}
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Grupo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Observaciones</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Activo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Fecha Creación</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {alumnos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      📭 No hay alumnos registrados
                    </td>
                  </tr>
                ) : (
                  alumnos.map((alumno) => (
                    <tr key={alumno.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{alumno.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{alumno.nombre}</td>
                      <td className="px-4 py-3 text-sm">{alumno.apellidos ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{alumno.dni ?? '—'}</td>
                      <td className="px-4 py-3 text-sm">{alumno.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{alumno.tlf ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{alumno.grupo ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{alumno.observaciones ?? '—'}</td>
                      <td className="h-5 w-3">
                            <input type="checkbox" checked={alumno.activo} readOnly/>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(alumno.fecha_creacion).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <button
                          onClick={() => editar(alumno)}
                          className="text-blue-600 hover:text-blue-900 mr-3 text-lg"
                          title="Editar alumno"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => eliminar(alumno.id)}
                          className="text-red-600 hover:text-red-900 text-lg"
                          title="Eliminar alumno"
                        >
                          🗑️
                        </button>
                         <button
                          onClick={() => crearUsuario(alumno.id)}
                          className="text-red-600 hover:text-red-900 text-lg"
                          title="Crear usuario"
                        >
                          👤
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

export default Alumnos