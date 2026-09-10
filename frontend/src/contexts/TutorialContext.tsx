import { createContext, useContext, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { authService } from "../services/authService";

export type TourId = "geral" | "carteiras" | "movimentacoes" | "cartoes" | "investimentos" | "relatorios" | "configuracoes";

interface TutorialContextValue {
  activeTour: TourId | null;
  startTour: (id: TourId) => void;
  stopTour: () => void;
  hasSeenTour: (id: TourId) => boolean;
  markTourSeen: (id: TourId) => void;
}

const TutorialContext = createContext<TutorialContextValue | undefined>(undefined);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeTour, setActiveTour] = useState<TourId | null>(null);
  const [seen, setSeen] = useState<string[]>(user?.seenTutorials ?? []);

  async function markTourSeen(id: TourId) {
    setSeen((prev) => [...prev, id]); // otimista, some da tela na hora
    setActiveTour(null);
    try {
      await authService.markTutorialSeen(id);
    } catch {
      // se a chamada falhar, na pior das hipóteses o tour volta a aparecer no próximo acesso
    }
  }

  return (
    <TutorialContext.Provider
      value={{
        activeTour,
        startTour: (id) => setActiveTour(id),
        stopTour: () => setActiveTour(null),
        hasSeenTour: (id) => seen.includes(id),
        markTourSeen,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error("useTutorial deve ser usado dentro de TutorialProvider");
  return ctx;
}