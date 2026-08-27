import api from "./api";
import type { DashboardSummary, Movement, Wallet, Card, Investment } from "../types";
import { scopeQuery, type ScopeParams } from "./scopeParams";

export const dashboardService = {
  async summary(scope: ScopeParams, month?: number, year?: number) {
    const { data } = await api.get<DashboardSummary>("/dashboard/summary", {
      params: { ...scopeQuery(scope), ...(month ? { month } : {}), ...(year ? { year } : {}) },
    });
    return data;
  },
};

export interface SearchResults {
  movements: Movement[];
  wallets: Wallet[];
  cards: Card[];
  investments: Investment[];
}

export const searchService = {
  async search(scope: ScopeParams, q: string) {
    const { data } = await api.get<SearchResults>("/search", { params: { ...scopeQuery(scope), q } });
    return data;
  },
};
