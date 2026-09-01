import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Repeat } from "lucide-react";
import { useScope } from "../contexts/ScopeContext";
import { movementService, type MovementFilters } from "../services/movementService";
import { walletService } from "../services/walletService";
import { categoryService } from "../services/categoryService";
import { cardService } from "../services/cardService";
import type { Movement, Wallet, Category, Card } from "../types";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { Loading } from "../components/Loading";
import { Select } from "../components/Select";
import { MovementForm, type MovementFormValues } from "../components/MovementForm";
import { MovementEditForm, type MovementEditValues } from "../components/MovementEditForm";
import { formatCurrency, formatDate, PAYMENT_METHOD_LABELS } from "../utils/format";
import { getErrorMessage } from "../services/api";

export function Movements() {
  const { scope, familyGroupId } = useScope();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Movement | null>(null);
  const [deleting, setDeleting] = useState<Movement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<MovementFilters["type"] | "">("");

  function load() {
    setLoading(true);
    const scopeParams = { scope, familyGroupId };
    const filters: MovementFilters = filterType ? { type: filterType } : {};
    Promise.all([
      movementService.list(scopeParams, filters),
      walletService.list(scopeParams),
      categoryService.list(scopeParams),
      cardService.list(scopeParams),
    ])
      .then(([m, w, c, cd]) => {
        setMovements(m);
        setWallets(w);
        setCategories(c);
        setCards(cd);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [scope, familyGroupId, filterType]);

  async function handleSubmit(values: MovementFormValues) {
    setSubmitting(true);
    setError("");
    try {
      await movementService.create({ ...values, scope: { scope, familyGroupId } });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível lançar a movimentação."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(values: MovementEditValues) {
    if (!editing) return;
    setSubmitting(true);
    setError("");
    try {
      await movementService.update(editing.id, values);
      setEditing(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar as alterações."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    await movementService.remove(deleting.id);
    setDeleting(null);
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Movimentações</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Lançar movimentação
        </Button>
      </div>

      <div className="filter-row">
        <Select value={filterType} onChange={(e) => setFilterType(e.target.value as MovementFilters["type"] | "")}>
          <option value="">Todos os tipos</option>
          <option value="EXPENSE">Despesas</option>
          <option value="INCOME">Receitas</option>
        </Select>
      </div>

      {loading ? (
        <Loading />
      ) : movements.length === 0 ? (
        <EmptyState
          title="Nenhuma movimentação encontrada"
          description="Lance sua primeira receita ou despesa."
          action={<Button onClick={() => setModalOpen(true)}>Lançar movimentação</Button>}
        />
      ) : (
        <ul className="movement-list">
          {movements.map((m) => (
            <li key={m.id} className="movement-row">
              <div className="movement-row-main">
                <span
                  className="category-dot"
                  style={{ background: m.category?.color || "var(--muted-2)" }}
                  aria-hidden="true"
                />
                <div>
                  <span className="movement-row-desc">
                    {m.description}
                    {m.installments > 1 && (
                      <span className="badge">
                        <Repeat size={12} /> parcelado
                      </span>
                    )}
                    {m.isRecurring && <span className="badge">recorrente</span>}
                  </span>
                  <span className="movement-row-meta">
                    {formatDate(m.date)} · {m.category?.name || "Sem categoria"} · {PAYMENT_METHOD_LABELS[m.paymentMethod]}
                    {m.user?.name && scope === "FAMILY" ? ` · ${m.user.name}` : ""}
                  </span>
                </div>
              </div>
              <span className={m.type === "EXPENSE" ? "amount-negative" : "amount-positive"}>
                {m.type === "EXPENSE" ? "-" : "+"}
                {formatCurrency(m.amount)}
              </span>
              <button type="button" className="icon-btn-muted" onClick={() => setEditing(m)} aria-label="Editar movimentação">
                <Pencil size={15} />
              </button>
              <button type="button" className="icon-btn-muted" onClick={() => setDeleting(m)} aria-label="Excluir movimentação">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={modalOpen} title="Lançar movimentação" onClose={() => setModalOpen(false)}>
        {error && <p className="field-error">{error}</p>}
        {wallets.length === 0 && cards.length === 0 ? (
          <EmptyState title="Cadastre uma carteira ou cartão primeiro" description="Você precisa de ao menos uma carteira ou cartão para lançar uma movimentação." />
        ) : (
          <MovementForm
            wallets={wallets}
            categories={categories}
            cards={cards}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
          />
        )}
      </Modal>

      <Modal open={!!editing} title="Editar movimentação" onClose={() => setEditing(null)}>
        {error && <p className="field-error">{error}</p>}
        {editing && (
          <MovementEditForm
            movement={editing}
            categories={categories}
            submitting={submitting}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir movimentação"
        message={`Tem certeza que deseja excluir "${deleting?.description}"? O saldo da carteira relacionada será ajustado.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}