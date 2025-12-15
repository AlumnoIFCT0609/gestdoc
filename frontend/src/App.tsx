import { useState, useEffect, useRef } from 'react'
import Login from './Login'
import Usuarios from './Usuarios'
import Cursos from './Cursos'
import Tutores from './Tutores'

interface Documento {
  id: number
  enlace: string
  fecha_creacion: string
  tema: string
  curso: string
  autor: string
  activo: boolean
}

function App() {
  const [autenticado, setAutenticado] = useState(false)
  const [usuario, setUsuario] = useState<any>(null)
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false)
  const [curso, setCurso] = useState<any>(null)
  const [mostrarCursos, setMostrarCursos] = useState(false)
  const [tutor, setTutor] = useState<any>(null)
  const [mostrarTutores, setMostrarTutores] = useState(false)
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [formData, setFormData] = useState({
    enlace: '',
    tema: '',
    curso: '',
    autor: '',
    activo: true
  })
  const [editando, setEditando] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [filtros, setFiltros] = useState({
    enlace:'',
    tema: '',
    curso: '',
    autor: '',
    activo: ''
  })
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    verificarAutenticacion()
  }, [])

  useEffect(() => {
    if (autenticado) {
      cargarDocumentos()
    }
  }, [autenticado])

  const verificarAutenticacion = async () => {
    const token = sessionStorage.getItem('token')
    const usuarioGuardado = sessionStorage.getItem('usuario')

    if (!token || !usuarioGuardado) {
      setAutenticado(false)
      return
    }

    try {
      const res = await fetch('/api/auth/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      if (res.ok) {
        setAutenticado(true)
        setUsuario(JSON.parse(usuarioGuardado))
      } else {
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('usuario')
        setAutenticado(false)
      }
    } catch (error) {
      setAutenticado(false)
    }
  }

  const handleLogin = (token: string, usuarioData: any) => {
    setAutenticado(true)
    setUsuario(usuarioData)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')
    setAutenticado(false)
    setUsuario(null)
  }

  const cargarDocumentos = async () => {
    try {
      const res = await fetch('/api/documentos')
      const data = await res.json()
      setDocumentos(data)
    } catch (error) {
      console.error('Error al cargar documentos:', error)
    }
  }

  const cargarPDFs = async () => {
    try {
      const res = await fetch('/api/cargar-pdfs', { method: 'POST' })
      const data = await res.json()
      setMensaje(data.mensaje)
      cargarDocumentos()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      setMensaje('Error al cargar PDFs')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editando) {
        await fetch(`/api/documentos/${editando}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        setMensaje('Documento actualizado')
      } else {
        await fetch('/api/documentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        setMensaje('Documento creado')
      }
      
      setFormData({ enlace: '', tema: '', curso: '', autor: '', activo:true })
      setEditando(null)
      cargarDocumentos()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      setMensaje('Error al guardar')
    }
  }

  const editar = (doc: Documento) => {
    setFormData({
      enlace: doc.enlace,
      tema: doc.tema,
      curso: doc.curso,
      autor: doc.autor,
      activo:doc.activo
    })
    setEditando(doc.id)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este documento?')) return
    
    try {
      await fetch(`/api/documentos/${id}`, { method: 'DELETE' })
      setMensaje('Documento eliminado')
      cargarDocumentos()
      setTimeout(() => setMensaje(''), 3000)
    } catch (error) {
      setMensaje('Error al eliminar')
    }
  }

  const cancelar = () => {
    setFormData({ enlace: '', tema: '', curso: '', autor: '', activo:true })
    setEditando(null)
  }

  const limpiarFiltros = () => {
    setFiltros({ enlace:'',tema: '', curso: '', autor: '', activo: '' })
  }

  const documentosFiltrados = documentos.filter(doc => {
    const cumpleEnlace = !filtros.enlace || doc.enlace.toLowerCase().includes(filtros.enlace.toLowerCase())
    const cumpleTema = !filtros.tema || doc.tema.toLowerCase().includes(filtros.tema.toLowerCase())
    const cumpleCurso = !filtros.curso || doc.curso.toLowerCase().includes(filtros.curso.toLowerCase())
    const cumpleAutor = !filtros.autor || doc.autor.toLowerCase().includes(filtros.autor.toLowerCase())
    const cumpleActivo = filtros.activo === '' || doc.activo === (filtros.activo === 'true')

    return cumpleTema && cumpleCurso && cumpleAutor
  })

  if (!autenticado) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      {mostrarUsuarios && <Usuarios onCerrar={() => setMostrarUsuarios(false)} />}
      {mostrarCursos && <Cursos onCerrar={() => setMostrarCursos(false)} />}
      {mostrarTutores && <Tutores onCerrar={() => setMostrarTutores(false)} />}  
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            📚 Gestión de Documentación
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMostrarTutores(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 text-sm rounded transition"
            >
              🧑‍🏫 Tutores
            </button>
            <button
              onClick={() => setMostrarCursos(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 text-sm rounded transition"
            >
              🎓 Cursos
            </button>
            
            <button
              onClick={() => setMostrarUsuarios(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 text-sm rounded transition"
            >
              👥 Usuarios
            </button>

            <span className="text-sm text-gray-600">
              👤 {usuario?.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm rounded transition"
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>

        {mensaje && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
            {mensaje}
          </div>
        )}

        <div ref={formRef} className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-700">
              {editando ? '✏️ Editando' : '➕ Nuevo'}
            </h2>
            <button
              onClick={cargarPDFs}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm rounded transition"
            >
              🔄 Cargar PDFs
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Enlace (URL o ruta)"
                value={formData.enlace}
                onChange={(e) => setFormData({ ...formData, enlace: e.target.value })}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Tema"
                value={formData.tema}
                onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Curso"
                value={formData.curso}
                onChange={(e) => setFormData({ ...formData, curso: e.target.value })}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Autor"
                value={formData.autor}
                onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 text-sm rounded transition"
              >
                {editando ? '💾 Actualizar' : '➕ Agregar'}
              </button>
              {editando && (
                <button
                  type="button"
                  onClick={cancelar}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-1.5 text-sm rounded transition"
                >
                  ❌ Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">🔍 Filtros:</span>
            <input
              type="text"
              placeholder="Archivo"
              value={filtros.enlace}
              onChange={(e) => setFiltros({ ...filtros, enlace: e.target.value })}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
            
            <input
              type="text"
              placeholder="Tema"
              value={filtros.tema}
              onChange={(e) => setFiltros({ ...filtros, tema: e.target.value })}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
            <input
              type="text"
              placeholder="Curso"
              value={filtros.curso}
              onChange={(e) => setFiltros({ ...filtros, curso: e.target.value })}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
            <input
              type="text"
              placeholder="Autor"
              value={filtros.autor}
              onChange={(e) => setFiltros({ ...filtros, autor: e.target.value })}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
            />
            <select value={filtros.activo}
              onChange={(e) => setFiltros({ ...filtros, activo: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
            <button
              onClick={limpiarFiltros}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 text-sm rounded transition whitespace-nowrap"
            >
              🗑️ Limpiar
            </button>
            <span className="text-xs text-gray-600 whitespace-nowrap">
              {documentosFiltrados.length}/{documentos.length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Enlace</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tema</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Autor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500 text-sm">
                      {documentos.length === 0 
                        ? '📭 No hay documentos. ¡Añade algunos!' 
                        : '🔍 No se encontraron documentos con esos filtros'}
                    </td>
                  </tr>
                ) : (
                  documentosFiltrados.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{doc.id}</td>
                      <td className="px-4 py-3 text-sm text-blue-600">
                        <a 
                          href={doc.enlace.startsWith('/docs') 
                            ? `http://localhost:3000${doc.enlace}` 
                            : doc.enlace
                          } 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:underline"
                        >
                          {doc.enlace.length > 50 ? doc.enlace.substring(0, 50) + '...' : doc.enlace}
                        </a>
                      </td>
                      
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{doc.tema}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{doc.curso}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{doc.autor}</td>
                      <td className="h-5 w-3">{doc.activo}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.fecha_creacion).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => editar(doc)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => eliminar(doc.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
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

export default App