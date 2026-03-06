export type UserRole = 'driver' | 'employee'

export interface User {
  id: string
  username: string
  fullName: string
  role: UserRole
  vehicleId?: string // только для водителя
  avatarUrl?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}
