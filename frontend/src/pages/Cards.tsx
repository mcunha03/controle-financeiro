import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, CreditCard as CardIcon } from "lucide-react";
import { useScope } from "../contexts/ScopeContext";
import { cardService, type InvoiceResponse } from "../services/cardService";
import type { Card } from "../types";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { Loading } from "../components/Loading";
import { CardForm, type CardFormValues } from "../components/CardForm";
import { formatCurrency } from "../utils/format";
import { getErrorMessage } from "../services/api";

export function Cards() {
  const { scope, familyGroupId } = useScope();
  const [cards, setCards] = useState<Card[]>([]);
  const [invoices, setInvoices] = useState<Record<string, InvoiceResponse>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState<Card | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const list = await cardService.list({ scope, familyGroupId });
      setCards(list);
      const invoiceEntries = await Promise.all(list.map((c) => cardService.invoice(c.id)));
      const map: Record<string, InvoiceResponse> = {};
      list.forEach((c, i) => (map[c.id] = invoiceEntries[i]));
      setInvoices(map);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, familyGroupId]);

  async function handleSubmit(values: CardFormValues) {
    setSubmitting(true);
    setError("");
    try {
      if (editing) {
        await cardService.update(editing.id, values);
      } else {
        await cardService.create({ ...values, scope: { scope, familyGroupId } });
      }
      setModalOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o cartão."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    await cardService.remove(deleting.id);
    setDeleting(null);
    load();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Cartões</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus size={16} /> Novo cartão
        </Button>
      </div>

      {loading ? (
        <Loading />
      ) : cards.length === 0 ? (
        <EmptyState
          title="Nenhum cartão cadastrado"
          description="Adicione um cartão de crédito para acompanhar sua fatura automaticamente."
          action={<Button onClick={() => setModalOpen(true)}>Adicionar cartão</Button>}
        />
      ) : (
        <div className="card-grid">
          {cards.map((card) => {
            const invoice = invoices[card.id];
            const usagePercent = invoice ? Math.min((invoice.total / Number(card.limit)) * 100, 100) : 0;
            return (
              <div key={card.id} className="entity-card entity-card-wide">
                <div className="entity-card-icon">
                  <CardIcon size={20} strokeWidth={1.75} />
                </div>
                <div className="entity-card-body">
                  <span className="entity-card-title">{card.name}</span>
                  <span className="entity-card-subtitle">
                    {card.brand ? `${card.brand} · ` : ""}fecha dia {card.closingDay}, vence dia {card.dueDay}
                  </span>
                  {invoice && (
                    <>
                      <span className="entity-card-value">
                        {formatCurrency(invoice.total)}{" "}
                        <span className="invoice-status">{invoice.status === "OPEN" ? "fatura aberta" : "fatura fechada"}</span>
                      </span>
                      <div className="usage-track">
                        <div className="usage-fill" style={{ width: `${usagePercent}%` }} />
                      </div>
                      <span className="usage-caption">
                        de {formatCurrency(card.limit)} de limite
                      </span>
                    </>
                  )}
                </div>
                <div className="entity-card-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(card);
                      setModalOpen(true);
                    }}
                    aria-label="Editar cartão"
                  >
                    <Pencil size={16} />
                  </button>
                  <button type="button" onClick={() => setDeleting(card)} aria-label="Excluir cartão">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Editar cartão" : "Novo cartão"}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
      >
        {error && <p className="field-error">{error}</p>}
        <CardForm
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
        title="Excluir cartão"
        message={`Tem certeza que deseja excluir "${deleting?.name}"?`}
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
