import api from "./api";
import type { Card, Movement } from "../types";
import { scopeQuery, type ScopeParams } from "./scopeParams";

export interface InvoiceResponse {
  cardId: string;
  referenceMonth: number;
  referenceYear: number;
  total: number;
  status: "OPEN" | "CLOSED";
  movements: Movement[];
}

export const cardService = {
  async list(scope: ScopeParams) {
    const { data } = await api.get<Card[]>("/cards", { params: scopeQuery(scope) });
    return data;
  },

  async create(payload: {
    name: string;
    brand?: string;
    closingDay: number;
    dueDay: number;
    limit: number;
    scope: ScopeParams;
  }) {
    const { data } = await api.post<Card>("/cards", {
      name: payload.name,
      brand: payload.brand,
      closingDay: payload.closingDay,
      dueDay: payload.dueDay,
      limit: payload.limit,
      scope: payload.scope.scope,
      familyGroupId: payload.scope.familyGroupId,
    });
    return data;
  },

  async update(id: string, payload: Partial<Pick<Card, "name" | "brand" | "closingDay" | "dueDay" | "limit">>) {
    const { data } = await api.put<Card>(`/cards/${id}`, payload);
    return data;
  },

  async remove(id: string) {
    await api.delete(`/cards/${id}`);
  },

  async invoice(id: string, month?: number, year?: number) {
    const { data } = await api.get<InvoiceResponse>(`/cards/${id}/invoice`, {
      params: { ...(month ? { month } : {}), ...(year ? { year } : {}) },
    });
    return data;
  },
};
