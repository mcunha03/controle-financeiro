// Tipos compartilhados, espelhando os modelos do backend (Prisma).
// Valores monetários chegam da API como string (Prisma Decimal serializado),
// por isso os campos abaixo são tipados como `string | number` e devem
// passar por Number(...) antes de qualquer cálculo ou formatação.

export type Scope = "PERSONAL" | "FAMILY";
export type MovementType = "EXPENSE" | "INCOME" | "TRANSFER";
export type CategoryType = "EXPENSE" | "INCOME" | "INVESTMENT";
export type PaymentMethod = "CASH" | "DEBIT" | "CREDIT" | "PIX" | "TRANSFER" | "OTHER";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  memberships?: FamilyMembership[];
}

export interface FamilyGroup {
  id: string;
  name: string;
  inviteCode: string;
  createdAt?: string;
}

export interface FamilyMembership {
  id: string;
  userId: string;
  familyGroupId: string;
  familyGroup: FamilyGroup;
}

export interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: string | number;
  scope: Scope;
  userId: string;
  familyGroupId?: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string | null;
  color?: string | null;
  isDefault: boolean;
  scope: Scope;
  userId?: string | null;
  familyGroupId?: string | null;
}

export interface Card {
  id: string;
  name: string;
  brand?: string | null;
  closingDay: number;
  dueDay: number;
  limit: string | number;
  scope: Scope;
  userId: string;
  familyGroupId?: string | null;
}

export interface Movement {
  id: string;
  description: string;
  amount: string | number;
  type: MovementType;
  date: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  installments: number;
  installmentOf?: string | null;
  scope: Scope;
  walletId?: string | null;
  categoryId?: string | null;
  cardId?: string | null;
  userId: string;
  familyGroupId?: string | null;
  category?: Category | null;
  wallet?: Wallet | null;
  card?: Card | null;
  user?: { id: string; name: string };
}

export interface InvestmentGoal {
  id: string;
  name: string;
  targetAmount: string | number;
  currentAmount: string | number;
  userId: string;
  investments?: Investment[];
}

export interface Investment {
  id: string;
  name: string;
  category: string;
  amount: string | number;
  yieldRate?: string | number | null;
  broker?: string | null;
  ticker?: string | null;
  scope: Scope;
  userId: string;
  familyGroupId?: string | null;
  goalId?: string | null;
  goal?: InvestmentGoal | null;
}

export interface FixedBill {
  id: string;
  name: string;
  amount: string | number;
  dueDay: number;
  category?: string | null;
  scope: Scope;
  userId: string;
  familyGroupId?: string | null;
  active: boolean;
}

export interface DashboardSummary {
  month: number;
  year: number;
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalInvested: number;
  netResult: number;
  walletsCount: number;
  expensesByCategory: Record<string, number>;
  recentMovements: Movement[];
}

export interface Budget {
  id: string;
  categoryId: string;
  month: number;
  year: number;
  limit: string | number;
  category?: Category;
}

export interface InstallmentGroup {
  installmentOf: string;
  description: string;
  totalAmount: number;
  installments: number;
  firstDate: string;
  lastDate: string;
  type: MovementType;
  category?: Category | null;
  card?: Card | null;
  wallet?: Wallet | null;
}