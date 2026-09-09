// src/services/investmentService.ts
import api from "./api";
import type { Investment, InvestmentGoal, InvestmentTransaction, InvestmentIncome } from "../types";
import { scopeQuery, type ScopeParams } from "./scopeParams";

export const investmentService = {
  async list(scope: ScopeParams) {
    const { data } = await api.get<Investment[]>("/investments", { params: scopeQuery(scope) });
    return data;
  },

async create(payload: {
  name: string;
  category: string;
  amount?: number;
  quantity?: number;
  unitPrice?: number;
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

  async update(id: string, payload: Partial<Pick<Investment, "name" | "amount" | "yieldRate" | "broker" | "goalId">>) {
    const { data } = await api.put<Investment>(`/investments/${id}`, payload);
    return data;
  },

  async remove(id: string) {
    await api.delete(`/investments/${id}`);
  },

  async get(id: string) {
    const { data } = await api.get<Investment>(`/investments/${id}`);
    return data;
  },

  async listTransactions(investmentId: string) {
    const { data } = await api.get<InvestmentTransaction[]>(`/investments/${investmentId}/transactions`);
    return data;
  },

  async createTransaction(
    investmentId: string,
    payload: { type: "BUY" | "SELL"; quantity: number; unitPrice: number; fees?: number; date: string }
  ) {
    const { data } = await api.post<Investment>(`/investments/${investmentId}/transactions`, payload);
    return data;
  },

  async updateTransaction(
    id: string,
    payload: Partial<{ type: "BUY" | "SELL"; quantity: number; unitPrice: number; fees: number; date: string }>
  ) {
    const { data } = await api.put<Investment>(`/investments/transactions/${id}`, payload);
    return data;
  },

  async removeTransaction(id: string) {
    const { data } = await api.delete<Investment>(`/investments/transactions/${id}`);
    return data;
  },

  async listIncomes(investmentId: string) {
    const { data } = await api.get<InvestmentIncome[]>(`/investments/${investmentId}/incomes`);
    return data;
  },

  async createIncome(
    investmentId: string,
    payload: { type: "DIVIDEND" | "JCP" | "RENDIMENTO"; amount: number; date: string }
  ) {
    const { data } = await api.post<InvestmentIncome>(`/investments/${investmentId}/incomes`, payload);
    return data;
  },

  async updateIncome(id: string, payload: Partial<{ type: "DIVIDEND" | "JCP" | "RENDIMENTO"; amount: number; date: string }>) {
    const { data } = await api.put<InvestmentIncome>(`/investments/incomes/${id}`, payload);
    return data;
  },

  async removeIncome(id: string) {
    await api.delete(`/investments/incomes/${id}`);
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