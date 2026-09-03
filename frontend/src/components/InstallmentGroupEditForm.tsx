import { useMemo, useState, type FormEvent } from "react";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import type { Category, InstallmentGroup } from "../types";

export interface InstallmentGroupEditValues {
  description: string;
  categoryId?: string;
}

export function InstallmentGroupEditForm({
  group,
  categories,
  onSubmit,
  onCancel,
  submitting,
}: {
  group: InstallmentGroup;
  categories: Category[];
  onSubmit: (values: InstallmentGroupEditValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [description, setDescription] = useState(group.description);
  const [categoryId, setCategoryId] = useState(group.category?.id || "");

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === (group.type === "EXPENSE" ? "EXPENSE" : "INCOME")),
    [categories, group.type]
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      description,
      categoryId: categoryId || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="stack-form">
      <p className="hint-block">
        Essa alteração será aplicada às {group.installments} parcelas dessa compra de uma só vez.
      </p>
      <Input label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} required />
      <Select label="Categoria" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="">Sem categoria</option>
        {filteredCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <div className="modal-actions">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          Salvar em todas as parcelas
        </Button>
      </div>
    </form>
  );
}