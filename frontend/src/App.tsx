import { useState, useEffect } from 'react'
import Login from './Login'
import Usuarios from './components/Usuarios'
import Cursos from './components/Cursos'
import Tutores from './components/Tutores'
import Alumnos from './components/Alumnos'
import Documentacion from './components/Documentacion'
import EdicionesCursos from './components/EdicionesCursos'  
import MatriculasAlumnos from './components/matriculasAlumnos'
import SubirPDFCloudinary from './components/SubirPDFCloudinary' // ← NUEVO

function App() {
  const [autenticado, setAutenticado] = useState(false)
  const [usuario, setUsuario] = useState<any>(null)
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false)
  const [mostrarCursos, setMostrarCursos] = useState(false)
  const [mostrarTutores, setMostrarTutores] = useState(false)
  const [mostrarAlumnos, setMostrarAlumnos] = useState(false)
  const [mostrarDocumentacion, setMostrarDocumentacion] = useState(false)
  const [mostrarEdicionesCursos, setMostrarEdicionesCursos] = useState(false)
  const [mostrarMatriculasAlumnos, setMostrarMatriculasAlumnos] = useState(false)
  const [mostrarSubirPDF, setMostrarSubirPDF] = useState(false) // ← NUEVO

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

  // Función para verificar permisos
  const tienePermiso = (seccion: string): boolean => {
    const rol = usuario?.rol

    const permisos: Record<string, string[]> = {
      'usuarios': ['Admin'],
      'cursos': ['Admin', 'Tutor', 'Alumno'],
      'tutores': ['Admin', 'Tutor'],
      'alumnos': ['Admin', 'Tutor'],
      'documentacion': ['Admin', 'Tutor', 'Alumno'],
      'edicionesCursos': ['Admin', 'Tutor'],
      'matriculasAlumnos': ['Admin', 'Tutor'],
      'subirPDF': ['Admin', 'Tutor'] // ← NUEVO
    }

    return permisos[seccion]?.includes(rol) || false
  }

  // Función para manejar apertura de secciones con validación
  const abrirSeccion = (seccion: string, setter: (valor: boolean) => void) => {
    if (tienePermiso(seccion)) {
      setter(true)
    } else {
      alert('⛔ No tienes permisos para acceder a esta sección')
    }
  }

  if (!autenticado) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="min-h-screen bg-app py-6 px-4">

      {/* Modales */}
      {mostrarUsuarios && tienePermiso('usuarios') && (
        <Usuarios onCerrar={() => setMostrarUsuarios(false)} />
      )}
      {mostrarCursos && tienePermiso('cursos') && (
        <Cursos onCerrar={() => setMostrarCursos(false)}  />
      )} 
      {mostrarTutores && tienePermiso('tutores') && (
        <Tutores onCerrar={() => setMostrarTutores(false)} />
      )}
      {mostrarAlumnos && tienePermiso('alumnos') && (
        <Alumnos onCerrar={() => setMostrarAlumnos(false)} />
      )}
      {mostrarDocumentacion && tienePermiso('documentacion') && (
        <Documentacion onCerrar={() => setMostrarDocumentacion(false)}  />
      )}
      {mostrarEdicionesCursos && tienePermiso('edicionesCursos') && (
        <EdicionesCursos onCerrar={() => setMostrarEdicionesCursos(false)} />
      )}
      {mostrarMatriculasAlumnos && tienePermiso('matriculasAlumnos') && (
        <MatriculasAlumnos onCerrar={() => setMostrarMatriculasAlumnos(false)} />
      )}
      
      {/* ← NUEVO: Modal para subir PDF a Cloudinary */}
      {mostrarSubirPDF && tienePermiso('subirPDF') && (
        <SubirPDFCloudinary 
          onCerrar={() => setMostrarSubirPDF(false)}
          onExito={() => {
            setMostrarSubirPDF(false)
            alert('✅ PDF subido correctamente a Cloudinary')
          }}
        />
      )}

      <div className="max-w-7xl mx-auto">

        {/* HEADER SUPERIOR */}
        <div className="mb-8 flex items-center justify-between border-b pb-4">
          <h2 className="text-3xl font-bold text-gray-800">
            📚 Gestión de Cursos
          </h2>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              👤 {usuario?.email} ({usuario?.rol})
            </span>

            {/* ← NUEVO: Botón Subir PDF (solo Admin y Tutor) */}
            {tienePermiso('subirPDF') && (
              <button
                onClick={() => setMostrarSubirPDF(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                ☁️ Subir PDF
              </button>
            )}

            <button
              onClick={handleLogout}
              className="bg-slate-400 hover:bg-slate-500 btn rounded-xl text-lg py-1 px-10"
            >
              ⏻ Salir
            </button>
          </div>
        </div>

        {/* MENÚ VERTICAL CENTRAL */}
        <div className="flex justify-center">
          <div className="flex flex-col gap-3 w-full max-w-xs">
            
            {/* Documentación - Admin, Tutor, Alumno */}
            {tienePermiso('documentacion') && (
              <button
                onClick={() => abrirSeccion('documentacion', setMostrarDocumentacion)}
                className="bg-blue-400 hover:bg-blue-500 btn rounded-xl text-lg py-2 text-left flex items-center px-4"
              >
                📖 Material educativo
              </button>
            )}

            {/* Cursos - Admin, Tutor, Alumno */}
            {tienePermiso('cursos') && (
              <button
                onClick={() => abrirSeccion('cursos', setMostrarCursos)}
                className="bg-yellow-400 hover:bg-yellow-500 btn rounded-xl text-lg py-2 text-left flex items-center px-4"
              >
                🎓 Cursos
              </button>
            )}

            {/* Alumnos - Solo Admin y Tutor */}
            {tienePermiso('alumnos') && (
              <button
                onClick={() => abrirSeccion('alumnos', setMostrarAlumnos)}
                className="bg-red-400 hover:bg-red-500 btn rounded-xl text-lg py-2 text-left flex items-center px-4"
              >
                👩‍🎓 Alumnos
              </button>
            )}

            {/* Tutores - Solo Admin y Tutor */}
            {tienePermiso('tutores') && (
              <button
                onClick={() => abrirSeccion('tutores', setMostrarTutores)}
                className="bg-green-400 hover:bg-green-500 btn rounded-xl text-lg py-2 text-left flex items-center px-4"
              >
                🧑‍🏫 Tutores
              </button>
            )}

            {/* Ediciones de Cursos - Solo Admin y Tutor */}
            {tienePermiso('edicionesCursos') && (
              <button
                onClick={() => abrirSeccion('edicionesCursos', setMostrarEdicionesCursos)}
                className="bg-indigo-400 hover:bg-indigo-500 btn rounded-xl text-lg py-2 text-left flex items-center px-4"
              >
                🎓 Ediciones de Cursos
              </button>
            )}

            {/* Matricular Alumnos - Solo Admin y Tutor */}
            {tienePermiso('matriculasAlumnos') && (
              <button
                onClick={() => abrirSeccion('matriculasAlumnos', setMostrarMatriculasAlumnos)}
                className="bg-lime-400 hover:bg-lime-500 btn rounded-xl text-lg py-2 text-left flex items-center px-4"
              >
                📋 Matricular Alumnos
              </button>
            )}

            {/* Usuarios - Solo Admin */}
            {tienePermiso('usuarios') && (
              <button
                onClick={() => abrirSeccion('usuarios', setMostrarUsuarios)}
                className="bg-zinc-400 hover:bg-zinc-500 btn rounded-xl text-lg py-2 text-left flex items-center px-4"
              >
                👥 Usuarios
              </button>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}

export default App