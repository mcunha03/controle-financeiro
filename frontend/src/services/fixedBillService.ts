import api from "./api";
import type { FixedBill } from "../types";
import { scopeQuery, type ScopeParams } from "./scopeParams";

export const fixedBillService = {
  async list(scope: ScopeParams) {
    const { data } = await api.get<FixedBill[]>("/fixed-bills", { params: scopeQuery(scope) });
    return data;
  },

  async upcoming(scope: ScopeParams) {
    const { data } = await api.get<FixedBill[]>("/fixed-bills/upcoming", { params: scopeQuery(scope) });
    return data;
  },

  async create(payload: { name: string; amount: number; dueDay: number; category?: string; scope: ScopeParams }) {
    const { data } = await api.post<FixedBill>("/fixed-bills", {
      name: payload.name,
      amount: payload.amount,
      dueDay: payload.dueDay,
      category: payload.category,
      scope: payload.scope.scope,
      familyGroupId: payload.scope.familyGroupId,
    });
    return data;
  },

  async update(id: string, payload: Partial<Pick<FixedBill, "name" | "amount" | "dueDay" | "category" | "active">>) {
    const { data } = await api.put<FixedBill>(`/fixed-bills/${id}`, payload);
    return data;
  },

  async remove(id: string) {
    await api.delete(`/fixed-bills/${id}`);
  },
};
