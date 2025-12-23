export const useAuthFetch = () => {
  const authFetch = async (
    url: string, 
    options: RequestInit = {}
  ) => {
    const API_URL = import.meta.env.VITE_API_URL || ''
    
    // Si es un archivo estático, no añadir token
    if (url.startsWith('/docs')) {
      return fetch(`${API_URL}${url}`, options)
    }
    
    // Para peticiones API, añadir token
    const token = sessionStorage.getItem('token')
    
    const headers: any = {
      ...(options.headers || {})
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return fetch(`${API_URL}${url}`, { 
      ...options, 
      headers
    })
  }
  
  return authFetch
}