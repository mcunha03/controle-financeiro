import { useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import type { InvestmentIncome } from "../types";
import { formatDateInput } from "../utils/format";

export interface InvestmentIncomeFormValues {
  type: "DIVIDEND" | "JCP" | "RENDIMENTO";
  amount: number;
  date: string;
}

const INCOME_TYPE_LABELS: Record<string, string> = {
  DIVIDEND: "Dividendo",
  JCP: "JCP",
  RENDIMENTO: "Rendimento",
};

export function InvestmentIncomeForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: InvestmentIncome;
  submitting?: boolean;
  onSubmit: (values: InvestmentIncomeFormValues) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<"DIVIDEND" | "JCP" | "RENDIMENTO">(initial?.type || "DIVIDEND");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(initial ? formatDateInput(initial.date) : formatDateInput(new Date()));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ type, amount: parseFloat(amount) || 0, date });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
        {Object.entries(INCOME_TYPE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <div className="field-row">
        <Input label="Valor recebido" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
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