import api from "./api";
import type { Category, CategoryType, Budget } from "../types";
import { scopeQuery, type ScopeParams } from "./scopeParams";

export const categoryService = {
  async list(scope: ScopeParams, type?: CategoryType) {
    const { data } = await api.get<Category[]>("/categories", {
      params: { ...scopeQuery(scope), ...(type ? { type } : {}) },
    });
    return data;
  },

  async create(payload: { name: string; type: CategoryType; icon?: string; color?: string; scope: ScopeParams }) {
    const { data } = await api.post<Category>("/categories", {
      name: payload.name,
      type: payload.type,
      icon: payload.icon,
      color: payload.color,
      scope: payload.scope.scope,
      familyGroupId: payload.scope.familyGroupId,
    });
    return data;
  },

  async update(id: string, payload: Partial<Pick<Category, "name" | "icon" | "color">>) {
    const { data } = await api.put<Category>(`/categories/${id}`, payload);
    return data;
  },

  async remove(id: string) {
    await api.delete(`/categories/${id}`);
  },

  async listBudgets(scope: ScopeParams, month: number, year: number) {
    const { data } = await api.get<Budget[]>("/categories/budgets/list", {
      params: { ...scopeQuery(scope), month, year },
    });
    return data;
  },

  async setBudget(categoryId: string, month: number, year: number, limit: number) {
    const { data } = await api.post<Budget>("/categories/budgets/set", { categoryId, month, year, limit });
    return data;
  },
};
