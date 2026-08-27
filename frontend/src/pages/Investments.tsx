import { useEffect, useState } from "react";
import { Plus, Trash2, Target } from "lucide-react";
import { useScope } from "../contexts/ScopeContext";
import { investmentService } from "../services/investmentService";
import type { Investment, InvestmentGoal } from "../types";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { Loading } from "../components/Loading";
import { InvestmentForm, type InvestmentFormValues } from "../components/InvestmentForm";
import { GoalForm, type GoalFormValues } from "../components/GoalForm";
import { formatCurrency, INVESTMENT_CATEGORY_LABELS } from "../utils/format";
import { getErrorMessage } from "../services/api";

export function Investments() {
  const { scope, familyGroupId } = useScope();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<InvestmentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Investment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([investmentService.list({ scope, familyGroupId }), investmentService.listGoals()])
      .then(([inv, g]) => {
        setInvestments(inv);
        setGoals(g);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [scope, familyGroupId]);

  async function handleSubmit(values: InvestmentFormValues) {
    setSubmitting(true);
    setError("");
    try {
      await investmentService.create({ ...values, scope: { scope, familyGroupId } });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o investimento."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateGoal(values: GoalFormValues) {
    setSubmitting(true);
    try {
      await investmentService.createGoal(values.name, values.targetAmount);
      setGoalModalOpen(false);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    await investmentService.remove(deleting.id);
    setDeleting(null);
    load();
  }

  const totalInvested = investments.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Investimentos</h1>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => setGoalModalOpen(true)}>
            <Target size={16} /> Nova meta
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> Novo investimento
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          {investments.length > 0 && (
            <p className="section-total">
              Total investido: <strong>{formatCurrency(totalInvested)}</strong>
            </p>
          )}

          {goals.length > 0 && (
            <section className="panel">
              <h2>Metas</h2>
              <div className="goal-grid">
                {goals.map((goal) => {
                  const percent = Math.min((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100, 100);
                  return (
                    <div key={goal.id} className="goal-card">
                      <span className="goal-card-title">{goal.name}</span>
                      <div className="usage-track">
                        <div className="usage-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="usage-caption">
                        {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {investments.length === 0 ? (
            <EmptyState
              title="Nenhum investimento cadastrado"
              description="Registre onde seu dinheiro está investido para acompanhar o total fora do saldo de conta."
              action={<Button onClick={() => setModalOpen(true)}>Adicionar investimento</Button>}
            />
          ) : (
            <ul className="movement-list">
              {investments.map((inv) => (
                <li key={inv.id} className="movement-row">
                  <div className="movement-row-main">
                    <span className="category-dot" style={{ background: "var(--accent)" }} aria-hidden="true" />
                    <div>
                      <span className="movement-row-desc">{inv.name}</span>
                      <span className="movement-row-meta">
                        {INVESTMENT_CATEGORY_LABELS[inv.category] || inv.category}
                        {inv.broker ? ` · ${inv.broker}` : ""}
                        {inv.yieldRate ? ` · ${Number(inv.yieldRate)}% a.a.` : ""}
                        {inv.goal ? ` · meta: ${inv.goal.name}` : ""}
                      </span>
                    </div>
                  </div>
                  <span>{formatCurrency(inv.amount)}</span>
                  <button type="button" className="icon-btn-muted" onClick={() => setDeleting(inv)} aria-label="Excluir investimento">
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={modalOpen} title="Novo investimento" onClose={() => setModalOpen(false)}>
        {error && <p className="field-error">{error}</p>}
        <InvestmentForm goals={goals} submitting={submitting} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} />
      </Modal>

      <Modal open={goalModalOpen} title="Nova meta de investimento" onClose={() => setGoalModalOpen(false)}>
        <GoalForm submitting={submitting} onSubmit={handleCreateGoal} onCancel={() => setGoalModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir investimento"
        message={`Tem certeza que deseja excluir "${deleting?.name}"?`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
