import { useEffect, useState } from 'react'

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
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [editando, setEditando] = useState<number | null>(null)
  const [mensaje, setMensaje] = useState('')

  const [formData, setFormData] = useState({
    enlace: '',
    tema: '',
    curso: '',
    autor: '',
    activo: true
  })

  const [filtros, setFiltros] = useState({
    enlace: '',
    tema: '',
    curso: '',
    autor: '',
    activo: ''
  })

  useEffect(() => {
    cargarDocumentos()
  }, [])

  const cargarDocumentos = async () => {
    try {
      const res = await fetch('/api/documentos')
      setDocumentos(await res.json())
    } catch {
      setMensaje('❌ Error al cargar documentos')
    }
  }

  const cargarPDFs = async () => {
    try {
      const res = await fetch('/api/cargar-pdfs', { method: 'POST' })
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

    const url = editando
      ? `/api/documentos/${editando}`
      : '/api/documentos'

    const res = await fetch(url, {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (!res.ok) {
      setMensaje('❌ Error al guardar documento')
      return
    }

    setMensaje(editando
      ? '✅ Documento actualizado'
      : '✅ Documento creado'
    )

    setFormData({ enlace: '', tema: '', curso: '', autor: '', activo: true })
    setEditando(null)
    cargarDocumentos()
    setTimeout(() => setMensaje(''), 3000)
  }

  const editar = (doc: Documento) => {
    setFormData({
      enlace: doc.enlace,
      tema: doc.tema,
      curso: doc.curso,
      autor: doc.autor,
      activo: doc.activo
    })
    setEditando(doc.id)
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este documento?')) return

    const res = await fetch(`/api/documentos/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setMensaje('❌ Error al eliminar documento')
      return
    }

    setMensaje('✅ Documento eliminado')
    cargarDocumentos()
    setTimeout(() => setMensaje(''), 3000)
  }

  const cancelar = () => {
    setFormData({ enlace: '', tema: '', curso: '', autor: '', activo: true })
    setEditando(null)
  }

  const limpiarFiltros = () => {
    setFiltros({ enlace: '', tema: '', curso: '', autor: '', activo: '' })
  }

  const documentosFiltrados = documentos.filter(doc => {
    const cumpleEnlace = !filtros.enlace || doc.enlace.toLowerCase().includes(filtros.enlace.toLowerCase())
    const cumpleTema = !filtros.tema || doc.tema.toLowerCase().includes(filtros.tema.toLowerCase())
    const cumpleCurso = !filtros.curso || doc.curso.toLowerCase().includes(filtros.curso.toLowerCase())
    const cumpleAutor = !filtros.autor || doc.autor.toLowerCase().includes(filtros.autor.toLowerCase())
    const cumpleActivo =
      filtros.activo === '' || doc.activo === (filtros.activo === 'true')

    return cumpleEnlace && cumpleTema && cumpleCurso && cumpleAutor && cumpleActivo
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            📚 Gestión de Documentación
          </h2>
          <button onClick={onCerrar} className="text-3xl font-bold text-gray-500">
            ×
          </button>
        </div>

        <div className="p-6">

          {/* MENSAJE */}
          {mensaje && (
            <div className={`mb-4 p-3 rounded text-sm ${
              mensaje.includes('❌')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {mensaje}
            </div>
          )}

          {/* FORMULARIO */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">
                {editando ? '✏️ Editar Documento' : '➕ Nuevo Documento'}
              </h3>
              <button
                onClick={cargarPDFs}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm rounded"
              >
                🔄 Cargar PDFs
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input placeholder="Enlace" value={formData.enlace}
                onChange={e => setFormData({ ...formData, enlace: e.target.value })}
                className="input" required />

              <input placeholder="Tema" value={formData.tema}
                onChange={e => setFormData({ ...formData, tema: e.target.value })}
                className="input" required />

              <input placeholder="Curso" value={formData.curso}
                onChange={e => setFormData({ ...formData, curso: e.target.value })}
                className="input" required />

              <input placeholder="Autor" value={formData.autor}
                onChange={e => setFormData({ ...formData, autor: e.target.value })}
                className="input" required />

              <input type="checkbox"
                checked={formData.activo}
                onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                className="h-5 w-5" />
            </form>

            <div className="mt-3 flex gap-2">
              <button className="bg-green-500 text-white px-4 py-2 rounded text-sm">
                {editando ? '💾 Actualizar' : '➕ Crear'}
              </button>
              {editando && (
                <button onClick={cancelar} className="bg-gray-500 text-white px-4 py-2 rounded text-sm">
                  ❌ Cancelar
                </button>
              )}
            </div>
          </div>

          {/* FILTROS */}
          <div className="bg-white border rounded-lg p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="font-semibold text-sm">🔍 Filtros:</span>

              <input placeholder="Archivo" value={filtros.enlace}
                onChange={e => setFiltros({ ...filtros, enlace: e.target.value })}
                className="input flex-1" />

              <input placeholder="Tema" value={filtros.tema}
                onChange={e => setFiltros({ ...filtros, tema: e.target.value })}
                className="input flex-1" />

              <input placeholder="Curso" value={filtros.curso}
                onChange={e => setFiltros({ ...filtros, curso: e.target.value })}
                className="input flex-1" />

              <input placeholder="Autor" value={filtros.autor}
                onChange={e => setFiltros({ ...filtros, autor: e.target.value })}
                className="input flex-1" />

              <select
                value={filtros.activo}
                onChange={e => setFiltros({ ...filtros, activo: e.target.value })}
                className="input"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>

              <button onClick={limpiarFiltros}
                className="bg-gray-500 text-white px-3 py-2 rounded text-sm">
                🗑️ Limpiar
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
                  <th>ID</th>
                  <th>Enlace</th>
                  <th>Tema</th>
                  <th>Curso</th>
                  <th>Autor</th>
                  <th>Activo</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {documentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      📭 No hay documentos
                    </td>
                  </tr>
                ) : (
                  documentosFiltrados.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td>{doc.id}</td>
                      <td className="text-blue-600 truncate max-w-xs">
                        <a href={doc.enlace} target="_blank" rel="noreferrer">
                          {doc.enlace}
                        </a>
                      </td>
                      <td>{doc.tema}</td>
                      <td>{doc.curso}</td>
                      <td>{doc.autor}</td>
                      <td>
                        <input type="checkbox" checked={doc.activo} readOnly />
                      </td>
                      <td>
                        {new Date(doc.fecha_creacion).toLocaleDateString('es-ES')}
                      </td>
                      <td>
                        <button onClick={() => editar(doc)} className="mr-2">✏️</button>
                        <button onClick={() => eliminar(doc.id)}>🗑️</button>
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

export default Documentacion
