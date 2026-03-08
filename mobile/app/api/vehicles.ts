import { httpClient } from "../lib/http-client";
import type { Vehicle } from "../types/vehicle";

export const vehiclesApi = {
  async getAll(): Promise<Vehicle[]> {
    return httpClient.get<Vehicle[]>("/api/vehicles");
  },
};
