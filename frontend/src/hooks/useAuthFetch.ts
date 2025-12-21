export const useAuthFetch = () => {
  const authFetch = async (
    url: string, 
    options: RequestInit = {}
  ) => {
    // Si es un archivo estático, no añadir token
    if (url.startsWith('/docs')) {
      return fetch(url, options)
    }
    
    // Para peticiones API, añadir token
    const token = sessionStorage.getItem('token')
    
    /*const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers
    }*/
   const headers: any = {
      ...(options.headers || {})
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return fetch(url, { 
      ...options, 
      headers
    })
  }
  
  return authFetch
}