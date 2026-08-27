import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useScope } from "../contexts/ScopeContext";
import { dashboardService } from "../services/dashboardService";
import { categoryService } from "../services/categoryService";
import type { DashboardSummary, Budget } from "../types";
import { Loading } from "../components/Loading";
import { EmptyState } from "../components/EmptyState";
import { formatCurrency, monthName } from "../utils/format";

export function Reports() {
  const { scope, familyGroupId } = useScope();
  const [reference, setReference] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const scopeParams = { scope, familyGroupId };
    Promise.all([
      dashboardService.summary(scopeParams, reference.month, reference.year),
      categoryService.listBudgets(scopeParams, reference.month, reference.year),
    ])
      .then(([s, b]) => {
        setSummary(s);
        setBudgets(b);
      })
      .finally(() => setLoading(false));
  }, [scope, familyGroupId, reference]);

  function changeMonth(delta: number) {
    setReference((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month > 12) {
        month = 1;
        year += 1;
      } else if (month < 1) {
        month = 12;
        year -= 1;
      }
      return { month, year };
    });
  }

  if (loading || !summary) return <Loading full />;

  const categoryEntries = Object.entries(summary.expensesByCategory).sort((a, b) => b[1] - a[1]);
  const total = summary.totalIncome + summary.totalExpense;
  const incomeShare = total > 0 ? (summary.totalIncome / total) * 100 : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Relatórios</h1>
        <div className="month-nav">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Mês anterior">
            <ChevronLeft size={18} />
          </button>
          <span>
            {monthName(reference.month)} de {reference.year}
          </span>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Próximo mês">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <h2>Receitas x Despesas</h2>
          <div className="split-bar">
            <div className="split-bar-income" style={{ width: `${incomeShare}%` }} />
            <div className="split-bar-expense" style={{ width: `${100 - incomeShare}%` }} />
          </div>
          <div className="split-bar-legend">
            <span className="amount-positive">Receitas: {formatCurrency(summary.totalIncome)}</span>
            <span className="amount-negative">Despesas: {formatCurrency(summary.totalExpense)}</span>
          </div>
          <p className="section-total">
            Resultado do mês:{" "}
            <strong className={summary.netResult >= 0 ? "amount-positive" : "amount-negative"}>
              {formatCurrency(summary.netResult)}
            </strong>
          </p>
        </section>

        <section className="panel">
          <h2>Despesas por categoria</h2>
          {categoryEntries.length === 0 ? (
            <EmptyState title="Sem despesas neste mês" />
          ) : (
            <div className="bar-list">
              {categoryEntries.map(([name, value]) => (
                <div key={name} className="bar-row">
                  <span className="bar-row-label">{name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(value / categoryEntries[0][1]) * 100}%` }} />
                  </div>
                  <span className="bar-row-value">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>Orçamento por categoria</h2>
        {budgets.length === 0 ? (
          <EmptyState
            title="Nenhum orçamento definido para este mês"
            description="Defina limites por categoria em Configurações para acompanhar aqui."
          />
        ) : (
          <div className="bar-list">
            {budgets.map((budget) => {
              const spent = summary.expensesByCategory[budget.category?.name || ""] || 0;
              const percent = Math.min((spent / Number(budget.limit)) * 100, 100);
              const overBudget = spent > Number(budget.limit);
              return (
                <div key={budget.id} className="bar-row">
                  <span className="bar-row-label">{budget.category?.name}</span>
                  <div className="bar-track">
                    <div className={`bar-fill ${overBudget ? "bar-fill-danger" : ""}`} style={{ width: `${percent}%` }} />
                  </div>
                  <span className="bar-row-value">
                    {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
