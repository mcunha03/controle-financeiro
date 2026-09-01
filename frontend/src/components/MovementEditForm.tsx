import { useMemo, useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import type { Category, Movement, PaymentMethod, Wallet, Card } from "../types";
import { PAYMENT_METHOD_LABELS, formatDateInput } from "../utils/format";

export interface MovementEditValues {
  description: string;
  amount: number;
  date: string;
  categoryId?: string;
  paymentMethod: PaymentMethod;
  destination?: "WALLET" | "CARD";
  walletId?: string;
  cardId?: string;
}

export function MovementEditForm({
  movement,
  categories,
  wallets,
  cards,
  onSubmit,
  onCancel,
  submitting,
}: {
  movement: Movement;
  categories: Category[];
  wallets: Wallet[];
  cards: Card[];
  onSubmit: (values: MovementEditValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [description, setDescription] = useState(movement.description);
  const [amount, setAmount] = useState(String(movement.amount));
  const [date, setDate] = useState(formatDateInput(movement.date));
  const [categoryId, setCategoryId] = useState(movement.categoryId || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(movement.paymentMethod);
  const [usesCard, setUsesCard] = useState(!!movement.cardId);
  const [walletId, setWalletId] = useState(movement.walletId || wallets[0]?.id || "");
  const [cardId, setCardId] = useState(movement.cardId || cards[0]?.id || "");

  const isInstallment = movement.installments > 1;

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === (movement.type === "EXPENSE" ? "EXPENSE" : "INCOME")),
    [categories, movement.type]
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const destinationChanged = !isInstallment && (usesCard ? cardId !== movement.cardId : walletId !== movement.walletId || !!movement.cardId);

    onSubmit({
      description,
      amount: parseFloat(amount) || 0,
      date,
      categoryId: categoryId || undefined,
      paymentMethod,
      destination: destinationChanged ? (usesCard ? "CARD" : "WALLET") : undefined,
      walletId: destinationChanged && !usesCard ? walletId : undefined,
      cardId: destinationChanged && usesCard ? cardId : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} required />
      <div className="field-row">
        <Input
          label="Valor"
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <Select label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">Sem categoria</option>
        {filteredCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Select label="Forma de pagamento" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
        {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      {isInstallment ? (
        <p className="hint-block">
          Esta movimentação é parcelada — o número de parcelas e a carteira/cartão não podem ser alterados aqui.
          Para isso, exclua e lance de novo.
        </p>
      ) : (
        <>
          <div className="type-toggle">
            <button type="button" className={!usesCard ? "type-toggle-active income" : ""} onClick={() => setUsesCard(false)}>
              Carteira
            </button>
            <button type="button" className={usesCard ? "type-toggle-active expense" : ""} onClick={() => setUsesCard(true)}>
              Cartão
            </button>
          </div>

          {usesCard ? (
            <Select label="Cartão" value={cardId} onChange={(e) => setCardId(e.target.value)} required>
              <option value="">Selecione um cartão</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          ) : (
            <Select label="Carteira" value={walletId} onChange={(e) => setWalletId(e.target.value)} required>
              <option value="">Selecione uma carteira</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>
          )}
        </>
      )}

      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}