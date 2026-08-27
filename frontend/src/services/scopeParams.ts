// Todo módulo com dado pessoal/família usa esses mesmos parâmetros de consulta.
export interface ScopeParams {
  scope: "PERSONAL" | "FAMILY";
  familyGroupId?: string;
}

export function scopeQuery(scope: ScopeParams): Record<string, string> {
  const query: Record<string, string> = { scope: scope.scope };
  if (scope.scope === "FAMILY" && scope.familyGroupId) {
    query.familyGroupId = scope.familyGroupId;
  }
  return query;
}
