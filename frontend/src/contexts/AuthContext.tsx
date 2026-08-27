import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../types";
import { authService } from "../services/authService";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("cf_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem("cf_token");
        localStorage.removeItem("cf_user");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { token, user: loggedUser } = await authService.login(email, password);
    localStorage.setItem("cf_token", token);
    setUser(loggedUser);
    const fullUser = await authService.me();
    setUser(fullUser);
  }

  async function register(name: string, email: string, password: string) {
    const { token, user: newUser } = await authService.register(name, email, password);
    localStorage.setItem("cf_token", token);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("cf_token");
    localStorage.removeItem("cf_user");
    setUser(null);
  }

  async function refreshUser() {
    const data = await authService.me();
    setUser(data);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  return ctx;
}
