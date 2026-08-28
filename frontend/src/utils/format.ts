// A API devolve valores decimais como string (Decimal do Prisma serializado em JSON).
// Esta função garante que qualquer valor vindo do backend vire um number antes de
// ser somado, subtraído ou formatado.
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(value: string | number | null | undefined): string {
  return toNumber(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateInput(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function monthName(month: number): string {
  const names = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return names[month - 1] || "";
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Dinheiro",
  DEBIT: "Débito",
  CREDIT: "Crédito",
  PIX: "Pix",
  TRANSFER: "Transferência",
  OTHER: "Outro",
};

export const CATEGORY_TYPE_LABELS: Record<string, string> = {
  EXPENSE: "Despesa",
  INCOME: "Receita",
  INVESTMENT: "Investimento",
};

export const INVESTMENT_CATEGORY_LABELS: Record<string, string> = {
  fixed_income: "Renda fixa",
  stocks: "Ações",
  emergency_reserve: "Reserva de emergência",
  FII: "Fundos imobiliários",
  ETF: "ETFs",
  crypto: "Criptomoedas",
  custom: "Personalizado",

};
