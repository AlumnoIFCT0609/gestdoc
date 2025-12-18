import { useEffect, useState, useRef } from 'react'

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
      const res = await fetch('/api/documentos')
      const data = await res.json()
      setDocumentos(data)
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

    const url = editando ? `/api/documentos/${editando}` : '/api/documentos'
    const method = editando ? 'PUT' : 'POST'

    const res = await fetch(url, {
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
    if (!confirm('¿Eliminar este documento?')) return
    await fetch(`/api/documentos/${id}`, { method: 'DELETE' })
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">

        <div className="sticky top-0 bg-white border-b p-4 flex justify-between">
          <h2 className="text-2xl font-bold">📚 Gestión de Documentación</h2>
          <button onClick={onCerrar} className="text-3xl">×</button>
        </div>

        <div className="p-6">

          {mensaje && <div className="mb-4 p-3 bg-gray-100 rounded">{mensaje}</div>}

          {/* FORMULARIO */}
          <div ref={formRef} className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">
              {editando ? '✏️ Editar Documento' : '➕ Nuevo Documento'}
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input className="input" placeholder="Enlace" value={formData.enlace}
                onChange={e => setFormData({ ...formData, enlace: e.target.value })} required />
              <input className="input" placeholder="Tema" value={formData.tema}
                onChange={e => setFormData({ ...formData, tema: e.target.value })} required />
              <input className="input" placeholder="Curso" value={formData.curso}
                onChange={e => setFormData({ ...formData, curso: e.target.value })} required />
              <input className="input" placeholder="Autor" value={formData.autor}
                onChange={e => setFormData({ ...formData, autor: e.target.value })} required />
              <input type="checkbox" checked={formData.activo}
                onChange={e => setFormData({ ...formData, activo: e.target.checked })} />

              <div className="md:col-span-5 flex gap-2 mt-3">
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
                {editando && (
                  <button type="button" onClick={cancelar}
                    className="bg-gray-500 text-white px-4 py-2 rounded">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* FILTROS */}
          <div className="bg-white border rounded-lg p-4 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="font-semibold text-sm">🔍 Filtros:</span>

              <input className="input flex-1" placeholder="Archivo"
                value={filtros.enlace}
                onChange={e => setFiltros({ ...filtros, enlace: e.target.value })} />
              <input className="input flex-1" placeholder="Tema"
                value={filtros.tema}
                onChange={e => setFiltros({ ...filtros, tema: e.target.value })} />
              <input className="input flex-1" placeholder="Curso"
                value={filtros.curso}
                onChange={e => setFiltros({ ...filtros, curso: e.target.value })} />
              <input className="input flex-1" placeholder="Autor"
                value={filtros.autor}
                onChange={e => setFiltros({ ...filtros, autor: e.target.value })} />

              <select className="input"
                value={filtros.activo}
                onChange={e => setFiltros({ ...filtros, activo: e.target.value })}>
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>

              <button onClick={limpiarFiltros}
                className="bg-gray-500 text-white px-3 py-2 rounded text-sm">
                Limpiar
              </button>

              <span className="text-xs text-gray-500">
                {documentosFiltrados.length}/{documentos.length}
              </span>
            </div>
          </div>

          {/* TABLA */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {documentosFiltrados.map(doc => (
                  <tr key={doc.id}>
                    <td>{doc.id}</td>
                    <td>{doc.enlace}</td>
                    <td>{doc.tema}</td>
                    <td>{doc.curso}</td>
                    <td>{doc.autor}</td>
                    <td>
                      <button onClick={() => editar(doc)}>✏️</button>
                      <button onClick={() => eliminar(doc.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Documentacion
