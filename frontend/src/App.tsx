import { useState, useEffect } from 'react'
import Login from './Login'
import Usuarios from './Usuarios'
import Cursos from './Cursos'
import Tutores from './Tutores'
import Alumnos from './Alumnos'
import Documentacion from './Documentacion'

function App() {
  const [autenticado, setAutenticado] = useState(false)
  const [usuario, setUsuario] = useState<any>(null)
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false)
  const [mostrarCursos, setMostrarCursos] = useState(false)
  const [mostrarTutores, setMostrarTutores] = useState(false)
  const [mostrarAlumnos, setMostrarAlumnos] = useState(false)
  const [mostrarDocumentacion, setMostrarDocumentacion] = useState(false)
  useEffect(() => {
    verificarAutenticacion()
  }, [])

  const verificarAutenticacion = async () => {
    const token = sessionStorage.getItem('token')
    const usuarioGuardado = sessionStorage.getItem('usuario')

    if (!token || !usuarioGuardado) return

    const res = await fetch('/api/auth/verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })

    if (res.ok) {
      setAutenticado(true)
      setUsuario(JSON.parse(usuarioGuardado))
    }
  }

  const handleLogin = (_token: string, usuarioData: any) => {
    setAutenticado(true)
    setUsuario(usuarioData)
  }

  const handleLogout = () => {
    sessionStorage.clear()
    setAutenticado(false)
    setUsuario(null)
  }

  if (!autenticado) {
    return <Login onLogin={handleLogin} />
  }

  return (
   <div className="min-h-screen bg-app py-6 px-4">

      {mostrarUsuarios && <Usuarios onCerrar={() => setMostrarUsuarios(false)} />}
      {mostrarCursos && <Cursos onCerrar={() => setMostrarCursos(false)} />}
      {mostrarTutores && <Tutores onCerrar={() => setMostrarTutores(false)} />}
      {mostrarAlumnos && <Alumnos onCerrar={() => setMostrarAlumnos(false)} />}
      {mostrarDocumentacion && <Documentacion onCerrar={() => setMostrarDocumentacion(false)} />}
      <div className="max-w-7xl mx-auto">

       {/* HEADER */}
<div className="mb-6">
  <div className="flex flex-wrap items-center justify-between gap-4">

    {/* IZQUIERDA – TÍTULO */}
    <h1 className="text-3xl font-bold text-gray-800 whitespace-nowrap">
      📚 Gestión de Cursos
    </h1>

    {/* CENTRO – NAVEGACIÓN */}
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        onClick={() => setMostrarDocumentacion(true)}
        className="bg-orange-400 hover:bg-orange-500 btn"
      >
        📖 Material educativo
      </button>

      <button
        onClick={() => setMostrarAlumnos(true)}
        className="bg-blue-400 hover:bg-blue-500 btn"
      >
        👩‍🎓 Alumnos
      </button>

      <button
        onClick={() => setMostrarTutores(true)}
        className="bg-yellow-400 hover:bg-yellow-500 btn"
      >
        🧑‍🏫 Tutores
      </button>

      <button
        onClick={() => setMostrarCursos(true)}
        className="bg-green-500 hover:bg-green-600 btn"
      >
        🎓 Cursos
      </button>

      <button
        onClick={() => setMostrarUsuarios(true)}
        className="bg-pink-500 hover:bg-pink-600 btn"
      >
        👥 Usuarios
      </button>
    </div>

    {/* DERECHA – USUARIO */}
    <div className="flex items-center gap-3 whitespace-nowrap">
      <span className="text-sm text-gray-600">
        👤 {usuario?.email}
      </span>

      <button
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 btn"
      >
        ⏻ Salir
      </button>
    </div>

  </div>
</div>



      </div>
    </div>
  )
}

export default App
