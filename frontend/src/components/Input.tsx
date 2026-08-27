import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, id, className = "", ...rest }: InputProps) {
  const inputId = id || rest.name;
  return (
    <label className="field" htmlFor={inputId}>
      {label && <span className="field-label">{label}</span>}
      <input id={inputId} className={`field-control ${error ? "field-control-error" : ""} ${className}`.trim()} {...rest} />
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
