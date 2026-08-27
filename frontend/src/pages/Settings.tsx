import { useEffect, useState, type FormEvent } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useScope } from "../contexts/ScopeContext";
import { authService } from "../services/authService";
import { categoryService } from "../services/categoryService";
import { fixedBillService } from "../services/fixedBillService";
import type { Category, FixedBill, Budget } from "../types";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CategoryForm, type CategoryFormValues } from "../components/CategoryForm";
import { FixedBillForm, type FixedBillFormValues } from "../components/FixedBillForm";
import { formatCurrency, monthName, CATEGORY_TYPE_LABELS } from "../utils/format";
import { getErrorMessage } from "../services/api";

export function Settings() {
  const { scope, familyGroupId, familyGroupName } = useScope();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Configurações</h1>
      </div>

      <div className="settings-stack">
        <ProfileSection />
        <PasswordSection />
        {scope === "FAMILY" && familyGroupId && (
          <FamilyGroupSection familyGroupId={familyGroupId} familyGroupName={familyGroupName} />
        )}
        <CategoriesSection />
        <BudgetsSection />
        <FixedBillsSection />
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await authService.updateProfile(name);
      await refreshUser();
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Perfil</h2>
      <form onSubmit={handleSubmit} className="stack-form stack-form-inline">
        <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email" value={user?.email || ""} disabled />
        <Button type="submit" disabled={busy}>
          Salvar
        </Button>
        {saved && <span className="save-confirmation">Salvo!</span>}
      </form>
    </section>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setBusy(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível alterar a senha."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>Alterar senha</h2>
      <form onSubmit={handleSubmit} className="stack-form stack-form-inline">
        <Input
          label="Senha atual"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          label="Nova senha"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
        />
        <Button type="submit" disabled={busy}>
          Alterar senha
        </Button>
        {saved && <span className="save-confirmation">Senha alterada!</span>}
      </form>
      {error && <p className="field-error">{error}</p>}
    </section>
  );
}

function FamilyGroupSection({ familyGroupId, familyGroupName }: { familyGroupId: string; familyGroupName?: string }) {
  const { user } = useAuth();
  const membership = user?.memberships?.find((m) => m.familyGroupId === familyGroupId);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!membership) return;
    navigator.clipboard.writeText(membership.familyGroup.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="panel">
      <h2>Grupo familiar: {familyGroupName}</h2>
      <p className="hint-block">Compartilhe este código para que outra pessoa entre no grupo (em "Pessoal" → "+ Família").</p>
      <div className="invite-code-row">
        <code className="invite-code">{membership?.familyGroup.inviteCode}</code>
        <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
          <Copy size={14} /> {copied ? "Copiado!" : "Copiar"}
        </Button>
      </div>
    </section>
  );
}

function CategoriesSection() {
  const { scope, familyGroupId } = useScope();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    categoryService.list({ scope, familyGroupId }).then(setCategories);
  }

  useEffect(load, [scope, familyGroupId]);

  async function handleSubmit(values: CategoryFormValues) {
    setSubmitting(true);
    setError("");
    try {
      await categoryService.create({ ...values, scope: { scope, familyGroupId } });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível criar a categoria."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await categoryService.remove(deleting.id);
    } catch {
      // categorias padrão não podem ser excluídas; a API já retorna 400 nesse caso
    }
    setDeleting(null);
    load();
  }

  return (
    <section className="panel">
      <div className="panel-header-row">
        <h2>Categorias</h2>
        <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} /> Nova
        </Button>
      </div>
      <div className="chip-list">
        {categories.map((cat) => (
          <span key={cat.id} className="chip" style={{ borderColor: cat.color || undefined }}>
            {cat.name}
            <span className="chip-type">{CATEGORY_TYPE_LABELS[cat.type]}</span>
            {!cat.isDefault && (
              <button type="button" onClick={() => setDeleting(cat)} aria-label={`Excluir ${cat.name}`}>
                <Trash2 size={12} />
              </button>
            )}
          </span>
        ))}
      </div>

      <Modal open={modalOpen} title="Nova categoria" onClose={() => setModalOpen(false)}>
        {error && <p className="field-error">{error}</p>}
        <CategoryForm submitting={submitting} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir categoria"
        message={`Tem certeza que deseja excluir "${deleting?.name}"?`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}

function BudgetsSection() {
  const { scope, familyGroupId } = useScope();
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [busy, setBusy] = useState(false);

  function load() {
    categoryService.list({ scope, familyGroupId }, "EXPENSE").then(setCategories);
    categoryService.listBudgets({ scope, familyGroupId }, month, year).then(setBudgets);
  }

  useEffect(load, [scope, familyGroupId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!categoryId || !limit) return;
    setBusy(true);
    try {
      await categoryService.setBudget(categoryId, month, year, parseFloat(limit));
      setCategoryId("");
      setLimit("");
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <h2>
        Orçamento por categoria — {monthName(month)} de {year}
      </h2>
      <form onSubmit={handleSubmit} className="stack-form-inline">
        <Select label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Selecione</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input label="Limite mensal" type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} />
        <Button type="submit" disabled={busy}>
          Definir
        </Button>
      </form>

      {budgets.length > 0 && (
        <ul className="recent-list">
          {budgets.map((b) => (
            <li key={b.id} className="recent-item">
              <span>{b.category?.name}</span>
              <span>{formatCurrency(b.limit)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FixedBillsSection() {
  const { scope, familyGroupId } = useScope();
  const [bills, setBills] = useState<FixedBill[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<FixedBill | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fixedBillService.list({ scope, familyGroupId }).then(setBills);
  }

  useEffect(load, [scope, familyGroupId]);

  async function handleSubmit(values: FixedBillFormValues) {
    setSubmitting(true);
    setError("");
    try {
      await fixedBillService.create({ ...values, scope: { scope, familyGroupId } });
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a conta fixa."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    await fixedBillService.remove(deleting.id);
    setDeleting(null);
    load();
  }

  return (
    <section className="panel">
      <div className="panel-header-row">
        <h2>Contas fixas</h2>
        <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={14} /> Nova
        </Button>
      </div>
      {bills.length === 0 ? (
        <p className="hint-block">Nenhuma conta fixa cadastrada. Você recebe um aviso uma semana antes do vencimento.</p>
      ) : (
        <ul className="recent-list">
          {bills.map((bill) => (
            <li key={bill.id} className="recent-item">
              <span>
                {bill.name} <span className="movement-row-meta">vence dia {bill.dueDay}</span>
              </span>
              <span>
                {formatCurrency(bill.amount)}
                <button type="button" className="icon-btn-muted" onClick={() => setDeleting(bill)} aria-label="Excluir conta fixa">
                  <Trash2 size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Modal open={modalOpen} title="Nova conta fixa" onClose={() => setModalOpen(false)}>
        {error && <p className="field-error">{error}</p>}
        <FixedBillForm submitting={submitting} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir conta fixa"
        message={`Tem certeza que deseja excluir "${deleting?.name}"?`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
