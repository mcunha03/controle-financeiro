import { useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Button } from "./Button";
import type { FixedBill } from "../types";

export interface FixedBillFormValues {
  name: string;
  amount: number;
  dueDay: number;
  category?: string;
}

export function FixedBillForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: FixedBill;
  onSubmit: (values: FixedBillFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [dueDay, setDueDay] = useState(initial ? String(initial.dueDay) : "10");
  const [category, setCategory] = useState(initial?.category || "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name, amount: parseFloat(amount) || 0, dueDay: parseInt(dueDay) || 1, category: category || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <Input label="Nome da conta" placeholder="Ex.: Aluguel" value={name} onChange={(e) => setName(e.target.value)} required />
      <div className="field-row">
        <Input label="Valor" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        <Input
          label="Dia de vencimento"
          type="number"
          min={1}
          max={31}
          value={dueDay}
          onChange={(e) => setDueDay(e.target.value)}
          required
        />
      </div>
      <Input label="Categoria (opcional)" placeholder="Ex.: Moradia" value={category} onChange={(e) => setCategory(e.target.value)} />
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {initial ? "Salvar alterações" : "Adicionar conta fixa"}
        </Button>
      </div>
    </form>
  );
}
