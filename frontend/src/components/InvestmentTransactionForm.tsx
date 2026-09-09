import { useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import type { InvestmentTransaction } from "../types";
import { formatDateInput } from "../utils/format";

export interface InvestmentTransactionFormValues {
  type: "BUY" | "SELL";
  quantity: number;
  unitPrice: number;
  fees?: number;
  date: string;
}

export function InvestmentTransactionForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: InvestmentTransaction;
  submitting?: boolean;
  onSubmit: (values: InvestmentTransactionFormValues) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<"BUY" | "SELL">(initial?.type || "BUY");
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : "");
  const [unitPrice, setUnitPrice] = useState(initial ? String(initial.unitPrice) : "");
  const [fees, setFees] = useState(initial?.fees ? String(initial.fees) : "");
  const [date, setDate] = useState(initial ? formatDateInput(initial.date) : formatDateInput(new Date()));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      type,
      quantity: parseFloat(quantity) || 0,
      unitPrice: parseFloat(unitPrice) || 0,
      fees: fees ? parseFloat(fees) : undefined,
      date,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value as "BUY" | "SELL")}>
        <option value="BUY">Compra</option>
        <option value="SELL">Venda</option>
      </Select>
      <div className="field-row">
        <Input
          label="Quantidade"
          type="number"
          step="0.00000001"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <Input
          label="Preço unitário"
          type="number"
          step="0.000001"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          required
        />
      </div>
      <div className="field-row">
        <Input label="Taxas (opcional)" type="number" step="0.01" value={fees} onChange={(e) => setFees(e.target.value)} />
        <Input label="Data" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}