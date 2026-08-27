import { useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import type { CategoryType } from "../types";

export interface CategoryFormValues {
  name: string;
  type: CategoryType;
  color: string;
}

const PRESET_COLORS = ["#1F3B34", "#B08A3E", "#7A2E2E", "#2F5D62", "#5B4B8A", "#8A5B2E"];

export function CategoryForm({
  onSubmit,
  onCancel,
  submitting,
}: {
  onSubmit: (values: CategoryFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("EXPENSE");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ name, type, color });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <Input label="Nome da categoria" placeholder="Ex.: Assinaturas" value={name} onChange={(e) => setName(e.target.value)} required />
      <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value as CategoryType)}>
        <option value="EXPENSE">Despesa</option>
        <option value="INCOME">Receita</option>
      </Select>
      <div className="field">
        <span className="field-label">Cor</span>
        <div className="color-swatches">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-swatch ${color === c ? "color-swatch-active" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Escolher cor ${c}`}
            />
          ))}
        </div>
      </div>
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          Criar categoria
        </Button>
      </div>
    </form>
  );
}
