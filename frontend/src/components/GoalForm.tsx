import { useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Button } from "./Button";

export interface GoalFormValues {
  name: string;
  targetAmount: number;
}

export function GoalForm({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (values: GoalFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name, targetAmount: parseFloat(targetAmount) || 0 });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <Input label="Nome da meta" placeholder="Ex.: Reserva de emergência" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input
        label="Valor alvo"
        type="number"
        step="0.01"
        value={targetAmount}
        onChange={(e) => setTargetAmount(e.target.value)}
        required
      />
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          Criar meta
        </Button>
      </div>
    </form>
  );
}
