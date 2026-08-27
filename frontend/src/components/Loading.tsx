export function Loading({ full = false, label = "Carregando..." }: { full?: boolean; label?: string }) {
  return (
    <div className={full ? "loading-full" : "loading-inline"}>
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
