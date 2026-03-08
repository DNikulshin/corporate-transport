export type Role = "driver" | "employee";

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  vehicleId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
