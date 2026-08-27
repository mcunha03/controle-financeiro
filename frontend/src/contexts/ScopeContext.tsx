import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import type { Scope } from "../types";

interface ScopeContextValue {
  scope: Scope;
  familyGroupId?: string;
  familyGroupName?: string;
  setPersonal: () => void;
  setFamily: (familyGroupId: string) => void;
  hasFamilyGroup: boolean;
}

const ScopeContext = createContext<ScopeContextValue | undefined>(undefined);

export function ScopeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [scope, setScope] = useState<Scope>(() => (localStorage.getItem("cf_scope") as Scope) || "PERSONAL");
  const [familyGroupId, setFamilyGroupId] = useState<string | undefined>(
    localStorage.getItem("cf_family_group_id") || undefined
  );

  const memberships = user?.memberships || [];
  const activeMembership = memberships.find((m) => m.familyGroupId === familyGroupId);

  // Se o usuário estava em escopo família mas não pertence (mais) a esse grupo, volta pro pessoal
  useEffect(() => {
    if (scope === "FAMILY" && user && !activeMembership) {
      if (memberships.length > 0) {
        setFamilyGroupId(memberships[0].familyGroupId);
      } else {
        setScope("PERSONAL");
        setFamilyGroupId(undefined);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function setPersonal() {
    setScope("PERSONAL");
    localStorage.setItem("cf_scope", "PERSONAL");
  }

  function setFamily(id: string) {
    setScope("FAMILY");
    setFamilyGroupId(id);
    localStorage.setItem("cf_scope", "FAMILY");
    localStorage.setItem("cf_family_group_id", id);
  }

  const value = useMemo<ScopeContextValue>(
    () => ({
      scope,
      familyGroupId: scope === "FAMILY" ? familyGroupId : undefined,
      familyGroupName: activeMembership?.familyGroup?.name,
      setPersonal,
      setFamily,
      hasFamilyGroup: memberships.length > 0,
    }),
    [scope, familyGroupId, activeMembership, memberships.length]
  );

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error("useScope deve ser usado dentro de um ScopeProvider.");
  return ctx;
}
