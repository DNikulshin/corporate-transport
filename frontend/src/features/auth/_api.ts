import { httpClient } from '@/shared/api/http-client'
import type { AuthResponse, LoginCredentials } from '@/shared/domain/user'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await httpClient.post<AuthResponse>('/auth/login', credentials)
    return data
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token')
    await httpClient.post('/auth/logout', { refreshToken })
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const { data } = await httpClient.post('/auth/refresh', { refreshToken })
    return data
  },

  me: async () => {
    const { data } = await httpClient.get('/auth/me')
    return data
  },
}
