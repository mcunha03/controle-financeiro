import api from "./api";
import type { User, FamilyGroup } from "../types";

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async register(name: string, email: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/register", { name, email, password });
    return data;
  },

  async login(email: string, password: string) {
    const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
    return data;
  },

  async me() {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  async updateProfile(name: string) {
    const { data } = await api.put<User>("/auth/me", { name });
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { data } = await api.put("/auth/change-password", { currentPassword, newPassword });
    return data;
  },

  async createFamilyGroup(name: string) {
    const { data } = await api.post<FamilyGroup>("/auth/family/create", { name });
    return data;
  },

  async joinFamilyGroup(inviteCode: string) {
    const { data } = await api.post<FamilyGroup>("/auth/family/join", { inviteCode });
    return data;
  },
};
