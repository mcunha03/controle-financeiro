import api from "./api";
import type { Wallet } from "../types";
import { scopeQuery, type ScopeParams } from "./scopeParams";

export const walletService = {
  async list(scope: ScopeParams) {
    const { data } = await api.get<Wallet[]>("/wallets", { params: scopeQuery(scope) });
    return data;
  },

  async create(payload: { name: string; type: string; balance: number; scope: ScopeParams }) {
    const { data } = await api.post<Wallet>("/wallets", {
      name: payload.name,
      type: payload.type,
      balance: payload.balance,
      scope: payload.scope.scope,
      familyGroupId: payload.scope.familyGroupId,
    });
    return data;
  },

  async update(id: string, payload: Partial<Pick<Wallet, "name" | "type" | "balance">>) {
    const { data } = await api.put<Wallet>(`/wallets/${id}`, payload);
    return data;
  },

  async remove(id: string) {
    await api.delete(`/wallets/${id}`);
  },
};
