import { useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Button } from "./Button";
import type { Card } from "../types";

export interface CardFormValues {
  name: string;
  brand: string;
  closingDay: number;
  dueDay: number;
  limit: number;
}

export function CardForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Card;
  onSubmit: (values: CardFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [brand, setBrand] = useState(initial?.brand || "");
  const [closingDay, setClosingDay] = useState(initial ? String(initial.closingDay) : "1");
  const [dueDay, setDueDay] = useState(initial ? String(initial.dueDay) : "10");
  const [limit, setLimit] = useState(initial ? String(initial.limit) : "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      brand,
      closingDay: parseInt(closingDay) || 1,
      dueDay: parseInt(dueDay) || 1,
      limit: parseFloat(limit) || 0,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <Input label="Nome do cartão" placeholder="Ex.: Nubank" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Bandeira" placeholder="Ex.: Mastercard" value={brand} onChange={(e) => setBrand(e.target.value)} />
      <div className="field-row">
        <Input
          label="Dia de fechamento"
          type="number"
          min={1}
          max={31}
          value={closingDay}
          onChange={(e) => setClosingDay(e.target.value)}
          required
        />
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
      <Input label="Limite" type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} required />
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {initial ? "Salvar alterações" : "Adicionar cartão"}
        </Button>
      </div>
    </form>
  );
}
