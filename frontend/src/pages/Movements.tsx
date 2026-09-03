import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Repeat } from "lucide-react";
import { useScope } from "../contexts/ScopeContext";
import { movementService, type MovementFilters } from "../services/movementService";
import { walletService } from "../services/walletService";
import { categoryService } from "../services/categoryService";
import { cardService } from "../services/cardService";
import type { Movement, Wallet, Category, Card, InstallmentGroup } from "../types";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { Loading } from "../components/Loading";
import { Select } from "../components/Select";
import { MovementForm, type MovementFormValues } from "../components/MovementForm";
import { MovementEditForm, type MovementEditValues } from "../components/MovementEditForm";
import { InstallmentGroupEditForm, type InstallmentGroupEditValues } from "../components/InstallmentGroupEditForm";
import { formatCurrency, formatDate, PAYMENT_METHOD_LABELS } from "../utils/format";
import { getErrorMessage } from "../services/api";

export function Movements() {
  const { scope, familyGroupId } = useScope();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [installmentGroups, setInstallmentGroups] = useState<InstallmentGroup[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Movement | null>(null);
  const [deleting, setDeleting] = useState<Movement | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<InstallmentGroup | null>(null);
  const [editingGroup, setEditingGroup] = useState<InstallmentGroup | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<MovementFilters["type"] | "">("");

  function load() {
    setLoading(true);
    const scopeParams = { scope, familyGroupId };
    const filters: MovementFilters = filterType ? { type: filterType } : {};
    Promise.all([
      movementService.list(scopeParams, filters),
      movementService.listInstallmentGroups(scopeParams),
      walletService.list(scopeParams),
      categoryService.list(scopeParams),
      cardService.list(scopeParams),
    ])
      .then(([m, groups, w, c, cd]) => {
        setMovements(m);
        setInstallmentGroups(groups);
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

  async function handleDeleteGroup() {
    if (!deletingGroup) return;
    await movementService.removeInstallmentGroup(deletingGroup.installmentOf);
    setDeletingGroup(null);
    load();
  }

    async function handleEditGroupSubmit(values: InstallmentGroupEditValues) {
    if (!editingGroup) return;
    setSubmitting(true);
    setError("");
    try {
      await movementService.updateInstallmentGroup(editingGroup.installmentOf, values);
      setEditingGroup(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar as alterações da compra parcelada."));
    } finally {
      setSubmitting(false);
    }
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
      ) : (
        <>
          {installmentGroups.length > 0 && (
            <section className="panel">
              <h2>Compras parceladas</h2>
              <ul className="movement-list">
                {installmentGroups.map((g) => (
                  <li key={g.installmentOf} className="movement-row">
                    <div className="movement-row-main">
                      <span
                        className="category-dot"
                        style={{ background: g.category?.color || "var(--muted-2)" }}
                        aria-hidden="true"
                      />
                      <div>
                        <span className="movement-row-desc">
                          {g.description}
                          <span className="badge">
                            <Repeat size={12} /> {g.installments}x
                          </span>
                        </span>
                        <span className="movement-row-meta">
                          {g.card?.name ? `Cartão: ${g.card.name} · ` : ""}
                          {formatDate(g.firstDate)} até {formatDate(g.lastDate)}
                        </span>
                      </div>
                    </div>
                    <span className={g.type === "EXPENSE" ? "amount-negative" : "amount-positive"}>
                      {g.type === "EXPENSE" ? "-" : "+"}
                      {formatCurrency(g.totalAmount)}
                    </span>

                    <button
                      type="button"
                      className="icon-btn-muted"
                      onClick={() => setEditingGroup(g)}
                      aria-label="Editar compra parcelada inteira"
                      >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      className="icon-btn-muted"
                      onClick={() => setDeletingGroup(g)}
                      aria-label="Excluir compra parcelada inteira"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {movements.length === 0 ? (
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
        </>
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
            wallets={wallets}
            cards={cards}
            submitting={submitting}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal open={!!editingGroup} title="Editar compra parcelada" onClose={() => setEditingGroup(null)}>
  {error && <p className="field-error">{error}</p>}
  {editingGroup && (
    <InstallmentGroupEditForm
      group={editingGroup}
      categories={categories}
      submitting={submitting}
      onSubmit={handleEditGroupSubmit}
      onCancel={() => setEditingGroup(null)}
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

      <ConfirmDialog
        open={!!deletingGroup}
        title="Excluir compra parcelada"
        message={`Tem certeza que deseja excluir "${deletingGroup?.description}" e todas as ${deletingGroup?.installments} parcelas dela? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir tudo"
        danger
        onConfirm={handleDeleteGroup}
        onCancel={() => setDeletingGroup(null)}
      />
    </div>
  );
}