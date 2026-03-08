import { env } from "../config/env";
import { authStorage } from "../lib/auth-storage";

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
}

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(requiresAuth = false): Promise<HeadersInit> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (requiresAuth) {
      const token = await authStorage.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  async get<T>(path: string, config?: RequestConfig): Promise<T> {
    const headers = await this.getHeaders(config?.requiresAuth ?? true);
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...config,
      method: "GET",
      headers,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(
    path: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const headers = await this.getHeaders(config?.requiresAuth);
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...config,
      method: "POST",
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }
}

export const httpClient = new HttpClient(env.apiUrl);
