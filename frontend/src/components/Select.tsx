import type { SelectHTMLAttributes, ReactNode } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, id, className = "", children, ...rest }: SelectProps) {
  const selectId = id || rest.name;
  return (
    <label className="field" htmlFor={selectId}>
      {label && <span className="field-label">{label}</span>}
      <select id={selectId} className={`field-control ${className}`.trim()} {...rest}>
        {children}
      </select>
    </label>
  );
}
