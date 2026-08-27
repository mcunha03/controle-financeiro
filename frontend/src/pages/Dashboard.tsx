import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useScope } from "../contexts/ScopeContext";
import { dashboardService } from "../services/dashboardService";
import { fixedBillService } from "../services/fixedBillService";
import type { DashboardSummary, FixedBill } from "../types";
import { Loading } from "../components/Loading";
import { EmptyState } from "../components/EmptyState";
import { formatCurrency, formatDate, monthName } from "../utils/format";

export function Dashboard() {
  const { scope, familyGroupId } = useScope();
  const [reference, setReference] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [upcomingBills, setUpcomingBills] = useState<FixedBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const scopeParams = { scope, familyGroupId };
    Promise.all([
      dashboardService.summary(scopeParams, reference.month, reference.year),
      fixedBillService.upcoming(scopeParams),
    ])
      .then(([summaryData, bills]) => {
        setSummary(summaryData);
        setUpcomingBills(bills);
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
  const maxCategoryValue = categoryEntries.length > 0 ? categoryEntries[0][1] : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Painel</h1>
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

      {upcomingBills.length > 0 && (
        <div className="alert-banner">
          <AlertTriangle size={18} />
          <span>
            {upcomingBills.length === 1
              ? `"${upcomingBills[0].name}" vence em breve.`
              : `${upcomingBills.length} contas fixas vencem nos próximos 7 dias.`}
          </span>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Saldo total</span>
          <span className="kpi-value">{formatCurrency(summary.totalBalance)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Receitas no mês</span>
          <span className="kpi-value amount-positive">{formatCurrency(summary.totalIncome)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Despesas no mês</span>
          <span className="kpi-value amount-negative">{formatCurrency(summary.totalExpense)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Investido</span>
          <span className="kpi-value">{formatCurrency(summary.totalInvested)}</span>
        </div>
      </div>

      <div className="panel-grid">
        <section className="panel">
          <h2>Despesas por categoria</h2>
          {categoryEntries.length === 0 ? (
            <EmptyState title="Sem despesas neste mês" description="Lance uma despesa para ver o resumo por categoria." />
          ) : (
            <div className="bar-list">
              {categoryEntries.map(([name, value]) => (
                <div key={name} className="bar-row">
                  <span className="bar-row-label">{name}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(value / maxCategoryValue) * 100}%` }} />
                  </div>
                  <span className="bar-row-value">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Movimentações recentes</h2>
          {summary.recentMovements.length === 0 ? (
            <EmptyState title="Nenhuma movimentação ainda" description="Suas últimas movimentações aparecerão aqui." />
          ) : (
            <ul className="recent-list">
              {summary.recentMovements.map((m) => (
                <li key={m.id} className="recent-item">
                  <div>
                    <span className="recent-item-desc">{m.description}</span>
                    <span className="recent-item-date">{formatDate(m.date)}</span>
                  </div>
                  <span className={m.type === "EXPENSE" ? "amount-negative" : "amount-positive"}>
                    {m.type === "EXPENSE" ? "-" : "+"}
                    {formatCurrency(m.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
