import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  TrendingUp,
  FileBarChart,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ScopeSwitch } from "./ScopeSwitch";
import { GlobalSearch } from "./GlobalSearch";

const NAV_ITEMS = [
  { to: "/", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/carteiras", label: "Carteiras", icon: Wallet },
  { to: "/movimentacoes", label: "Movimentações", icon: ArrowLeftRight },
  { to: "/cartoes", label: "Cartões", icon: CreditCard },
  { to: "/investimentos", label: "Investimentos", icon: TrendingUp },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Layout() {
  const { user, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${navOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">₡</span>
          <span className="sidebar-brand-name">Razão</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
              onClick={() => setNavOpen(false)}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="sidebar-link sidebar-logout" onClick={logout}>
          <LogOut size={18} strokeWidth={1.75} />
          <span>Sair</span>
        </button>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button type="button" className="topbar-menu-btn" onClick={() => setNavOpen((v) => !v)} aria-label="Menu">
            <Menu size={20} />
          </button>
          <ScopeSwitch />
          <div className="topbar-spacer" />
          <GlobalSearch />
          <span className="topbar-user">Olá, {user?.name?.split(" ")[0]}</span>
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
