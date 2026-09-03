import api from "./api";
import type { InstallmentGroup, Movement, MovementType, PaymentMethod } from "../types";
import { scopeQuery, type ScopeParams } from "./scopeParams";


export interface MovementFilters {
  from?: string;
  to?: string;
  categoryId?: string;
  walletId?: string;
  cardId?: string;
  type?: MovementType;
}

export interface MovementPayload {
  description: string;
  amount: number;
  type: MovementType;
  date?: string;
  paymentMethod?: PaymentMethod;
  isRecurring?: boolean;
  installments?: number;
  walletId?: string;
  categoryId?: string;
  cardId?: string;
  scope: ScopeParams;
}

export const movementService = {
  async list(scope: ScopeParams, filters: MovementFilters = {}) {
    const { data } = await api.get<Movement[]>("/movements", {
      params: { ...scopeQuery(scope), ...filters },
    });
    return data;
  },

  async create(payload: MovementPayload) {
    const { data } = await api.post<Movement | Movement[]>("/movements", {
      ...payload,
      scope: payload.scope.scope,
      familyGroupId: payload.scope.familyGroupId,
    });
    return data;
  },

  async update(
    id: string,
    payload: Partial<Pick<Movement, "description" | "amount" | "date" | "categoryId" | "paymentMethod">> & {
      destination?: "WALLET" | "CARD";
      walletId?: string;
      cardId?: string;
    }
  ) {
    const { data } = await api.put<Movement>(`/movements/${id}`, payload);
    return data;
  },

  async remove(id: string) {
    await api.delete(`/movements/${id}`);
  },


  async listInstallmentGroups(scope: ScopeParams) {
    const { data } = await api.get<InstallmentGroup[]>("/movements/installment-groups", { params: scopeQuery(scope) });
    return data;
  },

  async removeInstallmentGroup(installmentOf: string) {
    await api.delete(`/movements/installment-groups/${installmentOf}`);
  },

  
    async updateInstallmentGroup(installmentOf: string, payload: { description?: string; categoryId?: string }) {
    const { data } = await api.put<Movement[]>(`/movements/installment-groups/${installmentOf}`, payload);
    return data;
  },
};
