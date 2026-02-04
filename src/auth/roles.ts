export const ROLES = {
  admin: 'admin',
  manager: 'manager',
  staff: 'staff',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
