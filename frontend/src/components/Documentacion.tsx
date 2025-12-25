import { useEffect, useState, useRef } from 'react'
import { useAuthFetch } from '../hooks/useAuthFetch'
import { useRolePermissions } from '../hooks/useRolePermissions'

interface Documento {
  id: number
  enlace: string
  tema: string
  curso: string
  autor: string
  activo: boolean
  fecha_creacion: string
}

interface DocumentacionProps {
  onCerrar: () => void
}

function Documentacion({ onCerrar }: DocumentacionProps) {
  console.log('🔵 Componente Documentacion montado')

  const authFetch = useAuthFetch()
  const { canCreate, canEdit, canDelete, isLoading } = useRolePermissions(['Admin', 'Tutor'])
  
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
    enlace: '',
    tema: '',
    curso: '',
    autor: '',
    activo: ''
  })

  const formRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    cargarDocumentos()
  }, [])

  const cargarDocumentos = async () => {
    try {
      const res = await authFetch('/api/documentos')
      if (!res.ok) {
        setMensaje('❌ Error al cargar documentos')
        return
      }

      const data = await res.json()
      setDocumentos(Array.isArray(data) ? data : [])
    } catch {
      setMensaje('❌ Error al cargar documentos')
    }
  }

  const cargarPDFs = async () => {
    if (!canCreate) {
      setMensaje('❌ No tienes permisos para cargar PDFs')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    try {
      const res = await authFetch('/api/cargar-pdfs', { method: 'POST' })
      const data = await res.json()
      setMensaje(data.mensaje || '📄 PDFs cargados')
      cargarDocumentos()
      setTimeout(() => setMensaje(''), 3000)
    } catch {
      setMensaje('❌ Error al cargar PDFs')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canCreate && !editando) {
      setMensaje('❌ No tienes permisos para crear documentos')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    if (!canEdit && editando) {
      setMensaje('❌ No tienes permisos para editar documentos')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    const url = editando ? `/api/documentos/${editando}` : '/api/documentos'
    const method = editando ? 'PUT' : 'POST'

    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (!res.ok) {
      setMensaje('❌ Error al guardar documento')
      return
    }

    setMensaje(editando ? '✅ Documento actualizado' : '✅ Documento creado')
    setFormData({ enlace: '', tema: '', curso: '', autor: '', activo: true })
    setEditando(null)
    cargarDocumentos()
    setTimeout(() => setMensaje(''), 3000)
  }

  const editar = (doc: Documento) => {
    if (!canEdit) {
      setMensaje('❌ No tienes permisos para editar documentos')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    setFormData({
      enlace: doc.enlace,
      tema: doc.tema,
      curso: doc.curso,
      autor: doc.autor,
      activo: doc.activo
    })
    setEditando(doc.id)

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const eliminar = async (id: number) => {
    if (!canDelete) {
      setMensaje('❌ No tienes permisos para eliminar documentos')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    if (!confirm('¿Eliminar este documento?')) return
    await authFetch(`/api/documentos/${id}`, { method: 'DELETE' })
    cargarDocumentos()
  }

  const cancelar = () => {
    setFormData({ enlace: '', tema: '', curso: '', autor: '', activo: true })
    setEditando(null)
  }

  const limpiarFiltros = () => {
    setFiltros({ enlace: '', tema: '', curso: '', autor: '', activo: '' })
  }

  const documentosFiltrados = documentos.filter(doc => {
    return (
      (!filtros.enlace || doc.enlace.toLowerCase().includes(filtros.enlace.toLowerCase())) &&
      (!filtros.tema || doc.tema.toLowerCase().includes(filtros.tema.toLowerCase())) &&
      (!filtros.curso || doc.curso.toLowerCase().includes(filtros.curso.toLowerCase())) &&
      (!filtros.autor || doc.autor.toLowerCase().includes(filtros.autor.toLowerCase())) &&
      (filtros.activo === '' || doc.activo === (filtros.activo === 'true'))
    )
  })

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-white border-b p-4 flex justify-between">
          <h2 className="text-2xl font-bold">📚 Gestión de Documentación</h2>
          <button onClick={onCerrar} className="text-3xl">×</button>
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

          {canCreate && (
            <div ref={formRef} className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">
                  {editando ? '✏️ Editar Documento' : '➕ Nuevo Documento'}
                </h3>
                <button
                  onClick={cargarPDFs}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  📄 Cargar PDFs
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input 
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Enlace" 
                    value={formData.enlace}
                    onChange={e => setFormData({ ...formData, enlace: e.target.value })} 
                    required 
                  />
                  <input 
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Tema" 
                    value={formData.tema}
                    onChange={e => setFormData({ ...formData, tema: e.target.value })} 
                    required 
                  />
                  <input 
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Curso" 
                    value={formData.curso}
                    onChange={e => setFormData({ ...formData, curso: e.target.value })} 
                    required 
                  />
                  <input 
                    className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Autor" 
                    value={formData.autor}
                    onChange={e => setFormData({ ...formData, autor: e.target.value })} 
                    required 
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={formData.activo}
                      onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label className="text-sm text-gray-700">Activo</label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm rounded transition font-medium">
                    {editando ? '💾 Actualizar' : '➕ Crear'}
                  </button>
                  {editando && (
                    <button type="button" onClick={cancelar}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 text-sm rounded transition font-medium">
                      ❌ Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {!canCreate && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                ℹ️ Solo los administradores y tutores pueden crear, editar o eliminar documentos
              </p>
            </div>
          )}

          {/* FILTROS */}
          <div className="bg-white border rounded-lg p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="font-semibold text-sm">🔍 Filtros:</span>

              <input className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1" 
                placeholder="Archivo"
                value={filtros.enlace}
                onChange={e => setFiltros({ ...filtros, enlace: e.target.value })} 
              />
              <input className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1" 
                placeholder="Tema"
                value={filtros.tema}
                onChange={e => setFiltros({ ...filtros, tema: e.target.value })} 
              />
              <input className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1" 
                placeholder="Curso"
                value={filtros.curso}
                onChange={e => setFiltros({ ...filtros, curso: e.target.value })} 
              />
              <input className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1" 
                placeholder="Autor"
                value={filtros.autor}
                onChange={e => setFiltros({ ...filtros, autor: e.target.value })} 
              />

              <select className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filtros.activo}
                onChange={e => setFiltros({ ...filtros, activo: e.target.value })}>
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>

              <button onClick={limpiarFiltros}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition font-medium">
                Limpiar
              </button>

              <span className="text-xs text-gray-500">
                {documentosFiltrados.length}/{documentos.length}
              </span>
            </div>
          </div>

          {/* TABLA */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Enlace</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Tema</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Curso</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Autor</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Activo</th>
                  {(canEdit || canDelete) && (
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase border-b-2">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit || canDelete ? 6 : 5} className="px-4 py-8 text-center text-gray-500">
                      📭 No hay resultados con ese filtro
                    </td>
                  </tr>
                ) : (documentosFiltrados.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <a href={doc.enlace} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                        {doc.enlace.split('/').pop()}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{doc.tema}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{doc.curso}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{doc.autor}</td>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={doc.activo} readOnly className="h-5 w-5" />
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {canEdit && (
                          <button onClick={() => editar(doc)} className="text-blue-600 hover:text-blue-900 mr-3 text-lg">✏️</button>
                        )}
                        {canDelete && (
                          <button onClick={() => eliminar(doc.id)} className="text-red-600 hover:text-red-900 text-lg">🗑️</button>
                        )}
                      </td>
                    )}
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Documentacion