import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Wallet as WalletIcon } from "lucide-react";
import { useScope } from "../contexts/ScopeContext";
import { walletService } from "../services/walletService";
import type { Wallet } from "../types";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { Loading } from "../components/Loading";
import { WalletForm, type WalletFormValues } from "../components/WalletForm";
import { formatCurrency } from "../utils/format";
import { getErrorMessage } from "../services/api";

const WALLET_TYPE_LABELS: Record<string, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  cash: "Dinheiro em espécie",
  other: "Outra",
};

export function Wallets() {
  const { scope, familyGroupId } = useScope();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [deleting, setDeleting] = useState<Wallet | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    walletService
      .list({ scope, familyGroupId })
      .then(setWallets)
      .finally(() => setLoading(false));
  }

  useEffect(load, [scope, familyGroupId]);

  async function handleSubmit(values: WalletFormValues) {
    setSubmitting(true);
    setError("");
    try {
      if (editing) {
        await walletService.update(editing.id, values);
      } else {
        await walletService.create({ ...values, scope: { scope, familyGroupId } });
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar a carteira."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    await walletService.remove(deleting.id);
    setDeleting(null);
    load();
  }

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Carteiras</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} /> Nova carteira
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : wallets.length === 0 ? (
        <EmptyState
          title="Nenhuma carteira cadastrada"
          description="Crie uma carteira para começar a registrar suas movimentações."
          action={<Button onClick={() => setModalOpen(true)}>Criar primeira carteira</Button>}
        />
      ) : (
        <>
          <p className="section-total">
            Saldo somado: <strong>{formatCurrency(totalBalance)}</strong>
          </p>
          <div className="card-grid">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="entity-card">
                <div className="entity-card-icon">
                  <WalletIcon size={20} strokeWidth={1.75} />
                </div>
                <div className="entity-card-body">
                  <span className="entity-card-title">{wallet.name}</span>
                  <span className="entity-card-subtitle">{WALLET_TYPE_LABELS[wallet.type] || wallet.type}</span>
                  <span className="entity-card-value">{formatCurrency(wallet.balance)}</span>
                </div>
                <div className="entity-card-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(wallet);
                      setModalOpen(true);
                    }}
                    aria-label="Editar carteira"
                  >
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => setDeleting(wallet)} aria-label="Excluir carteira">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Editar carteira" : "Nova carteira"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      >
        {error && <p className="field-error">{error}</p>}
        <WalletForm
          initial={editing || undefined}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Excluir carteira"
        message={`Tem certeza que deseja excluir "${deleting?.name}"? As movimentações vinculadas a ela permanecerão registradas.`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
