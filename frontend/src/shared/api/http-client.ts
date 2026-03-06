import axios, { type AxiosInstance } from 'axios'
import { env } from '@/shared/config/env'

let _refreshPromise: Promise<string> | null = null

export function createHttpClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${env.apiUrl}/api`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15_000,
  })

  // Attach access token
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  // Refresh on 401
  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config
      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error)
      }
      original._retry = true

      if (!_refreshPromise) {
        _refreshPromise = refreshAccessToken().finally(() => {
          _refreshPromise = null
        })
      }

      try {
        const newToken = await _refreshPromise
        original.headers.Authorization = `Bearer ${newToken}`
        return client(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/auth'
        return Promise.reject(error)
      }
    },
  )

  return client
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) throw new Error('No refresh token')

  const res = await axios.post(`${env.apiUrl}/api/auth/refresh`, {
    refreshToken,
  })
  const { accessToken } = res.data
  localStorage.setItem('access_token', accessToken)
  return accessToken
}

export const httpClient = createHttpClient()
