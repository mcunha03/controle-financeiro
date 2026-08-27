import { useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import type { Wallet } from "../types";

export interface WalletFormValues {
  name: string;
  type: string;
  balance: number;
}

const WALLET_TYPES = [
  { value: "checking", label: "Conta corrente" },
  { value: "savings", label: "Poupança" },
  { value: "cash", label: "Dinheiro em espécie" },
  { value: "other", label: "Outra" },
];

export function WalletForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Wallet;
  onSubmit: (values: WalletFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState(initial?.type || "checking");
  const [balance, setBalance] = useState(initial ? String(initial.balance) : "0");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name, type, balance: parseFloat(balance) || 0 });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <Input label="Nome da carteira" placeholder="Ex.: Conta principal" value={name} onChange={(e) => setName(e.target.value)} required />
      <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value)}>
        {WALLET_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Select>
      <Input
        label={initial ? "Saldo atual" : "Saldo inicial"}
        type="number"
        step="0.01"
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
        required
      />
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {initial ? "Salvar alterações" : "Criar carteira"}
        </Button>
      </div>
    </form>
  );
}
