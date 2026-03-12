import { httpClient } from "../lib/http-client";
import { authStorage } from "../lib/auth-storage";
import type { User, LoginCredentials, AuthTokens } from "../types/user";

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

interface RefreshResponse {
  accessToken: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await httpClient.post<LoginResponse>(
      "/api/auth/login",
      credentials,
      {
        requiresAuth: false,
      }
    );

    await authStorage.setAccessToken(response.tokens.accessToken);
    await authStorage.setRefreshToken(response.tokens.refreshToken);
    await authStorage.setUser(response.user);

    return response;
  },

  async logout(): Promise<void> {
    const refreshToken = await authStorage.getRefreshToken();
    try {
      await httpClient.post("/api/auth/logout", { refreshToken });
    } catch {
      // Ignore errors
    } finally {
      await authStorage.clearAll();
    }
  },

  async refresh(): Promise<string> {
    const refreshToken = await authStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    const response = await httpClient.post<RefreshResponse>(
      "/api/auth/refresh",
      {
        refreshToken,
      }
    );

    await authStorage.setAccessToken(response.accessToken);
    return response.accessToken;
  },

  async getMe(): Promise<User> {
    return httpClient.get<User>("/api/auth/me");
  },
};
