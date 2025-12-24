import { useState } from 'react'
import { useAuthFetch } from '../hooks/useAuthFetch'

interface SubirPDFCloudinaryProps {
  onCerrar: () => void
  onExito?: () => void
}

export default function SubirPDFCloudinary({ onCerrar, onExito }: SubirPDFCloudinaryProps) {
  const authFetch = useAuthFetch()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [carpeta, setCarpeta] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const handleArchivoSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea PDF
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setMensaje('❌ Solo se permiten archivos PDF')
        return
      }
      setArchivo(file)
      setMensaje('')
    }
  }

  const handleSubir = async () => {
    if (!archivo) {
      setMensaje('❌ Selecciona un archivo PDF')
      return
    }

    setSubiendo(true)
    setMensaje('📤 Subiendo archivo...')

    try {
      // Convertir archivo a Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(archivo)
      })

      // Enviar al backend
      const res = await authFetch('/api/subir-pdf-cloudinary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileBase64: base64,
          filename: archivo.name,
          carpeta: carpeta || 'general'
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al subir archivo')
      }

      setMensaje(`✅ ${data.mensaje}`)
      setArchivo(null)
      setCarpeta('')
      
      // Notificar éxito
      if (onExito) {
        setTimeout(() => onExito(), 1500)
      }

    } catch (error) {
      console.error('Error:', error)
      setMensaje(`❌ Error: ${(error as Error).message}`)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        
        <div className="bg-blue-500 text-white p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-bold">☁️ Subir PDF a Cloudinary</h2>
          <button onClick={onCerrar} className="text-2xl hover:text-gray-200">×</button>
        </div>

        <div className="p-6">
          
          {mensaje && (
            <div className={`mb-4 p-3 rounded ${
              mensaje.startsWith('✅') ? 'bg-green-100 text-green-800' :
              mensaje.startsWith('❌') ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {mensaje}
            </div>
          )}

          <div className="space-y-4">
            
            {/* Carpeta/Tema */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                📁 Carpeta/Tema (opcional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Ej: JavaScript, Python, HTML..."
                value={carpeta}
                onChange={(e) => setCarpeta(e.target.value)}
                disabled={subiendo}
              />
              <p className="text-xs text-gray-500 mt-1">
                Si no especificas, se guardará en "general"
              </p>
            </div>

            {/* Selector de archivo */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                📄 Seleccionar archivo PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleArchivoSeleccionado}
                disabled={subiendo}
                className="w-full"
              />
              {archivo && (
                <p className="text-sm text-gray-600 mt-2">
                  ✓ {archivo.name} ({(archivo.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubir}
                disabled={!archivo || subiendo}
                className="flex-1 bg-blue-500 text-white px-4 py-3 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
              >
                {subiendo ? '⏳ Subiendo...' : '☁️ Subir a Cloudinary'}
              </button>
              
              <button
                onClick={onCerrar}
                disabled={subiendo}
                className="px-4 py-3 bg-gray-300 rounded hover:bg-gray-400 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}