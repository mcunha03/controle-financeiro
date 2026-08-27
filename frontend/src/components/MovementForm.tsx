import { useMemo, useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import type { Category, Wallet, Card, MovementType, PaymentMethod } from "../types";
import { PAYMENT_METHOD_LABELS } from "../utils/format";
import { formatDateInput } from "../utils/format";

export interface MovementFormValues {
  description: string;
  amount: number;
  type: MovementType;
  date: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  installments: number;
  walletId?: string;
  categoryId?: string;
  cardId?: string;
}

export function MovementForm({
  wallets,
  categories,
  cards,
  onSubmit,
  onCancel,
  submitting,
}: {
  wallets: Wallet[];
  categories: Category[];
  cards: Card[];
  onSubmit: (values: MovementFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [type, setType] = useState<MovementType>("EXPENSE");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(formatDateInput(new Date()));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [walletId, setWalletId] = useState(wallets[0]?.id || "");
  const [cardId, setCardId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [installments, setInstallments] = useState("1");

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === (type === "EXPENSE" ? "EXPENSE" : "INCOME")),
    [categories, type]
  );

  const usesCard = paymentMethod === "CREDIT";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      description,
      amount: parseFloat(amount) || 0,
      type,
      date,
      paymentMethod,
      isRecurring,
      installments: usesCard ? parseInt(installments) || 1 : 1,
      walletId: usesCard ? undefined : walletId || undefined,
      categoryId: categoryId || undefined,
      cardId: usesCard ? cardId || undefined : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <div className="type-toggle">
        <button type="button" className={type === "EXPENSE" ? "type-toggle-active expense" : ""} onClick={() => setType("EXPENSE")}>
          Despesa
        </button>
        <button type="button" className={type === "INCOME" ? "type-toggle-active income" : ""} onClick={() => setType("INCOME")}>
          Receita
        </button>
      </div>

      <Input
        label="Descrição"
        placeholder="Ex.: Supermercado"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <div className="field-row">
        <Input label="Valor" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
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

      {usesCard ? (
        <>
          <Select label="Cartão" value={cardId} onChange={(e) => setCardId(e.target.value)} required>
            <option value="">Selecione um cartão</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Parcelas"
            type="number"
            min={1}
            max={48}
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
          />
        </>
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

      <label className="checkbox-field">
        <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
        <span>Este é um gasto/receita recorrente todo mês</span>
      </label>

      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          Lançar {type === "EXPENSE" ? "despesa" : "receita"}
        </Button>
      </div>
    </form>
  );
}
