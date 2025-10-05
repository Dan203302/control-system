export type Role = 'admin' | 'manager' | 'engineer' | 'observer'

export function hasRole(userRole: string, required: Role | Role[]) {
  if (!userRole) return false
  const req = Array.isArray(required) ? required : [required]
  return req.includes(userRole as Role)
}

export function hasAnyRole(userRole: string, roles: Role[]) {
  return hasRole(userRole, roles)
}

export function isAdmin(userRole: string) {
  return userRole === 'admin'
}
