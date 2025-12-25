import { useState, useEffect } from 'react'

interface RolePermissions {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  isLoading: boolean
  role: string | null
}

export function useRolePermissions(allowedRoles: string[] = ['Admin']) {
  const [permissions, setPermissions] = useState<RolePermissions>({
    canCreate: false,
    canEdit: false,
    canDelete: false,
    isLoading: true,
    role: null
  })

  useEffect(() => {
    const userRole = sessionStorage.getItem('rol')
    
    console.log('🔍 Role obtenido de sessionStorage:', userRole)
    console.log('🔍 Roles permitidos:', allowedRoles)
    
    const hasPermission = userRole ? allowedRoles.includes(userRole) : false
    
    console.log('🔍 Tiene permisos:', hasPermission)
    
    setPermissions({
      canCreate: hasPermission,
      canEdit: hasPermission,
      canDelete: hasPermission,
      isLoading: false,
      role: userRole
    })
  }, [allowedRoles.join(',')])

  return permissions
}