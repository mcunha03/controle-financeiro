import { useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import type { Category, Movement, PaymentMethod } from "../types";
import { PAYMENT_METHOD_LABELS, formatDateInput } from "../utils/format";

export interface MovementEditValues {
  description: string;
  amount: number;
  date: string;
  categoryId?: string;
  paymentMethod: PaymentMethod;
}

export function MovementEditForm({
  movement,
  categories,
  onSubmit,
  onCancel,
  submitting,
}: {
  movement: Movement;
  categories: Category[];
  onSubmit: (values: MovementEditValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [description, setDescription] = useState(movement.description);
  const [amount, setAmount] = useState(String(movement.amount));
  const [date, setDate] = useState(formatDateInput(movement.date));
  const [categoryId, setCategoryId] = useState(movement.categoryId || "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(movement.paymentMethod);

  const filteredCategories = categories.filter(
    (c) => c.type === (movement.type === "EXPENSE" ? "EXPENSE" : "INCOME")
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      description,
      amount: parseFloat(amount) || 0,
      date,
      categoryId: categoryId || undefined,
      paymentMethod,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <p className="hint-block">
        Carteira, cartão e parcelamento não podem ser alterados aqui — para isso, exclua e lance de novo.
      </p>
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