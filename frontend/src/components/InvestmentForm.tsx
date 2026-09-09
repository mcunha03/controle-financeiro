// src/components/InvestmentForm.tsx
import { useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import type { Investment, InvestmentGoal } from "../types";
import { INVESTMENT_CATEGORY_LABELS } from "../utils/format";

export interface InvestmentFormValues {
  name: string;
  category: string;
  amount?: number;
  quantity?: number;
  unitPrice?: number;
  yieldRate?: number;
  broker?: string;
  ticker?: string;
  goalId?: string;
}

export function InvestmentForm({
  initial,
  goals,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Investment;
  goals: InvestmentGoal[];
  onSubmit: (values: InvestmentFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || "fixed_income");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [yieldRate, setYieldRate] = useState(initial?.yieldRate ? String(initial.yieldRate) : "");
  const [broker, setBroker] = useState(initial?.broker || "");
  const [ticker, setTicker] = useState(initial?.ticker || "");
  const [goalId, setGoalId] = useState(initial?.goalId || "");

  const hasTicker = Boolean(ticker.trim());
  const isEditing = Boolean(initial);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      category,
      amount: hasTicker ? undefined : amount ? parseFloat(amount) : 0,
      quantity: hasTicker && !isEditing ? (quantity ? parseFloat(quantity) : undefined) : undefined,
      unitPrice: hasTicker && !isEditing ? (unitPrice ? parseFloat(unitPrice) : undefined) : undefined,
      yieldRate: yieldRate ? parseFloat(yieldRate) : undefined,
      broker: broker || undefined,
      ticker: ticker || undefined,
      goalId: goalId || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <Input label="Nome" placeholder="Ex.: Tesouro Selic 2029 ou Petrobras" value={name} onChange={(e) => setName(e.target.value)} required />

      <Select label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)}>
        {Object.entries(INVESTMENT_CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <div className="field-row">
        <Input label="Código/Ticker (opcional)" placeholder="Ex: PETR4, HGLG11" value={ticker} onChange={(e) => setTicker(e.target.value)} />
        <Input label="Corretora/Banco (opcional)" value={broker} onChange={(e) => setBroker(e.target.value)} />
      </div>

      {hasTicker && !isEditing && (
        <>
          <small className="movement-row-meta">
            Como este ativo tem ticker, informe a compra inicial: a quantidade e o preço definem o valor investido.
          </small>
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
              label="Preço de compra (unitário)"
              type="number"
              step="0.01"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
          </div>
        </>
      )}

      {hasTicker && isEditing && (
        <small className="movement-row-meta">
          Para alterar a posição (quantidade/preço médio), lance uma compra ou venda na tela de detalhes do ativo.
        </small>
      )}

      <div className="field-row">
        {!hasTicker && (
          <Input
            label="Valor aplicado"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required={!hasTicker}
          />
        )}
        <Input
          label="Rendimento (% a.a., opcional)"
          type="number"
          step="0.01"
          value={yieldRate}
          onChange={(e) => setYieldRate(e.target.value)}
        />
      </div>

      {goals.length > 0 && (
        <Select label="Meta vinculada (opcional)" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
          <option value="">Nenhuma</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      )}

      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {initial ? "Salvar alterações" : "Adicionar investimento"}
        </Button>
      </div>
    </form>
  );
}