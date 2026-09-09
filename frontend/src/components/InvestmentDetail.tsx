import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { investmentService } from "../services/investmentService";
import type { Investment, InvestmentTransaction, InvestmentIncome } from "../types";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { Loading } from "./Loading";
import { InvestmentTransactionForm, type InvestmentTransactionFormValues } from "./InvestmentTransactionForm";
import { InvestmentIncomeForm, type InvestmentIncomeFormValues } from "./InvestmentIncomeForm";
import { formatCurrency, formatDate } from "../utils/format";
import { getErrorMessage } from "../services/api";

const TX_TYPE_LABELS: Record<string, string> = { BUY: "Compra", SELL: "Venda" };
const INCOME_TYPE_LABELS: Record<string, string> = { DIVIDEND: "Dividendo", JCP: "JCP", RENDIMENTO: "Rendimento" };

export function InvestmentDetail({
  investmentId,
  onChanged,
}: {
  investmentId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formMode, setFormMode] = useState<null | "transaction" | "income">(null);
  const [editingTx, setEditingTx] = useState<InvestmentTransaction | null>(null);
  const [editingIncome, setEditingIncome] = useState<InvestmentIncome | null>(null);
  const [deletingTx, setDeletingTx] = useState<InvestmentTransaction | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<InvestmentIncome | null>(null);

  function load() {
    setLoading(true);
    investmentService
      .get(investmentId)
      .then(setInvestment)
      .finally(() => setLoading(false));
  }

  useEffect(load, [investmentId]);

  async function handleSaveTransaction(values: InvestmentTransactionFormValues) {
    setSubmitting(true);
    setError("");
    try {
      if (editingTx) {
        await investmentService.updateTransaction(editingTx.id, values);
      } else {
        await investmentService.createTransaction(investmentId, values);
      }
      setFormMode(null);
      setEditingTx(null);
      load();
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a transação."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveIncome(values: InvestmentIncomeFormValues) {
    setSubmitting(true);
    setError("");
    try {
      if (editingIncome) {
        await investmentService.updateIncome(editingIncome.id, values);
      } else {
        await investmentService.createIncome(investmentId, values);
      }
      setFormMode(null);
      setEditingIncome(null);
      load();
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o provento."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTransaction() {
    if (!deletingTx) return;
    await investmentService.removeTransaction(deletingTx.id);
    setDeletingTx(null);
    load();
    onChanged();
  }

  async function handleDeleteIncome() {
    if (!deletingIncome) return;
    await investmentService.removeIncome(deletingIncome.id);
    setDeletingIncome(null);
    load();
    onChanged();
  }

  if (loading || !investment) return <Loading />;

  if (formMode === "transaction") {
    return (
      <>
        {error && <p className="field-error">{error}</p>}
        <InvestmentTransactionForm
          initial={editingTx || undefined}
          submitting={submitting}
          onSubmit={handleSaveTransaction}
          onCancel={() => {
            setFormMode(null);
            setEditingTx(null);
          }}
        />
      </>
    );
  }

  if (formMode === "income") {
    return (
      <>
        {error && <p className="field-error">{error}</p>}
        <InvestmentIncomeForm
          initial={editingIncome || undefined}
          submitting={submitting}
          onSubmit={handleSaveIncome}
          onCancel={() => {
            setFormMode(null);
            setEditingIncome(null);
          }}
        />
      </>
    );
  }

  const summary = investment.summary;

  return (
    <div className="stack-form">
      <section className="panel">
        <h2>Posição</h2>
        <div className="goal-grid">
          <div className="goal-card">
            <span className="goal-card-title">Quantidade</span>
            <span className="usage-caption">{Number(investment.quantity || 0)}</span>
          </div>
          <div className="goal-card">
            <span className="goal-card-title">Preço médio</span>
            <span className="usage-caption">{formatCurrency(investment.avgPrice)}</span>
          </div>
          <div className="goal-card">
            <span className="goal-card-title">Valor aportado</span>
            <span className="usage-caption">{formatCurrency(investment.amount)}</span>
          </div>
          {summary && (
            <>
              <div className="goal-card">
                <span className="goal-card-title">Proventos (12m)</span>
                <span className="usage-caption">{formatCurrency(summary.income12m)}</span>
              </div>
              <div className="goal-card">
                <span className="goal-card-title">D.Y. sobre custo</span>
                <span className="usage-caption">{summary.dividendYieldOnCost.toFixed(2)}%</span>
              </div>
              <div className="goal-card">
                <span className="goal-card-title">Proventos (total)</span>
                <span className="usage-caption">{formatCurrency(summary.totalIncome)}</span>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="page-header">
          <h2>Transações</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingTx(null);
              setFormMode("transaction");
            }}
          >
            <Plus size={14} /> Nova
          </Button>
        </div>
        {!investment.transactions || investment.transactions.length === 0 ? (
          <p className="usage-caption">Nenhuma transação lançada ainda.</p>
        ) : (
          <ul className="movement-list">
            {investment.transactions.map((tx) => (
              <li key={tx.id} className="movement-row">
                <div className="movement-row-main">
                  <div>
                    <span className="movement-row-desc">
                      {TX_TYPE_LABELS[tx.type]} · {Number(tx.quantity)} un.
                    </span>
                    <span className="movement-row-meta">
                      {formatCurrency(tx.unitPrice)} · {formatDate(tx.date)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="icon-btn-muted"
                  onClick={() => {
                    setEditingTx(tx);
                    setFormMode("transaction");
                  }}
                  aria-label="Editar transação"
                >
                  <Pencil size={15} />
                </button>
                <button type="button" className="icon-btn-muted" onClick={() => setDeletingTx(tx)} aria-label="Excluir transação">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="page-header">
          <h2>Proventos</h2>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditingIncome(null);
              setFormMode("income");
            }}
          >
            <Plus size={14} /> Novo
          </Button>
        </div>
        {!investment.incomes || investment.incomes.length === 0 ? (
          <p className="usage-caption">Nenhum provento lançado ainda.</p>
        ) : (
          <ul className="movement-list">
            {investment.incomes.map((income) => (
              <li key={income.id} className="movement-row">
                <div className="movement-row-main">
                  <div>
                    <span className="movement-row-desc">{INCOME_TYPE_LABELS[income.type]}</span>
                    <span className="movement-row-meta">{formatDate(income.date)}</span>
                  </div>
                </div>
                <span>{formatCurrency(income.amount)}</span>
                <button
                  type="button"
                  className="icon-btn-muted"
                  onClick={() => {
                    setEditingIncome(income);
                    setFormMode("income");
                  }}
                  aria-label="Editar provento"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn-muted"
                  onClick={() => setDeletingIncome(income)}
                  aria-label="Excluir provento"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={!!deletingTx}
        title="Excluir transação"
        message="Tem certeza que deseja excluir esta transação? A posição será recalculada."
        confirmLabel="Excluir"
        danger
        onConfirm={handleDeleteTransaction}
        onCancel={() => setDeletingTx(null)}
      />

      <ConfirmDialog
        open={!!deletingIncome}
        title="Excluir provento"
        message="Tem certeza que deseja excluir este provento?"
        confirmLabel="Excluir"
        danger
        onConfirm={handleDeleteIncome}
        onCancel={() => setDeletingIncome(null)}
      />
    </div>
  );
}