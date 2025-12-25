import { useState } from 'react'

interface LoginProps {
  onLogin: (token: string, usuario: any) => void
}

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setCargando(true)

  try {
    const API_URL = import.meta.env.VITE_API_URL || ''
    
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al iniciar sesión')
      setCargando(false)
      return
    }

    sessionStorage.setItem('token', data.token)
    sessionStorage.setItem('usuario', JSON.stringify(data.usuario))
    sessionStorage.setItem('rol', data.usuario.rol)
    
    onLogin(data.token, data.usuario)
  } catch (error) {
    setError('Error de conexión')
    setCargando(false)
  }
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📚 Documentación</h1>
          <p className="text-gray-600">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@admin.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition disabled:opacity-50"
          >
            {cargando ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded text-sm text-gray-600">
          <p className="font-semibold mb-1">👤 Credenciales de prueba:</p>
          <p>Email: <span className="font-mono">alumno@admin.com</span></p>
          <p>Password: <span className="font-mono">alumno123</span></p>
        </div>
      </div>
    </div>
  )
}

export default Login