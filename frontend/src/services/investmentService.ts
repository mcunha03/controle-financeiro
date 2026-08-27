import api from "./api";
import type { Investment, InvestmentGoal } from "../types";
import { scopeQuery, type ScopeParams } from "./scopeParams";

export const investmentService = {
  async list(scope: ScopeParams) {
    const { data } = await api.get<Investment[]>("/investments", { params: scopeQuery(scope) });
    return data;
  },

  async create(payload: {
    name: string;
    category: string;
    amount: number;
    yieldRate?: number;
    broker?: string;
    ticker?: string;
    goalId?: string;
    scope: ScopeParams;
  }) {
    const { data } = await api.post<Investment>("/investments", {
      ...payload,
      scope: payload.scope.scope,
      familyGroupId: payload.scope.familyGroupId,
    });
    return data;
  },

  async update(id: string, payload: Partial<Pick<Investment, "name" | "amount" | "yieldRate" | "broker" | "ticker">>) {
    const { data } = await api.put<Investment>(`/investments/${id}`, payload);
    return data;
  },

  async remove(id: string) {
    await api.delete(`/investments/${id}`);
  },

  async listGoals() {
    const { data } = await api.get<InvestmentGoal[]>("/investments/goals/list");
    return data;
  },

  async createGoal(name: string, targetAmount: number) {
    const { data } = await api.post<InvestmentGoal>("/investments/goals", { name, targetAmount });
    return data;
  },

  async updateGoal(id: string, payload: Partial<Pick<InvestmentGoal, "name" | "targetAmount">>) {
    const { data } = await api.put<InvestmentGoal>(`/investments/goals/${id}`, payload);
    return data;
  },

  async removeGoal(id: string) {
    await api.delete(`/investments/goals/${id}`);
  },
};
