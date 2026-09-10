import { NavLink, Outlet, useLocation } from "react-router-dom";
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
  HelpCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Joyride, STATUS, type EventData } from "react-joyride";
import { useAuth } from "../contexts/AuthContext";
import { ScopeSwitch } from "./ScopeSwitch";
import { GlobalSearch } from "./GlobalSearch";
import { useTutorial } from "../contexts/TutorialContext";
import { ROUTE_TOURS } from "../tutorials/tours";

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
  const location = useLocation();
  const { activeTour, startTour, markTourSeen, hasSeenTour } = useTutorial();

  const routeTour = ROUTE_TOURS[location.pathname];

  useEffect(() => {
    if (routeTour && !hasSeenTour(routeTour.id)) {
      startTour(routeTour.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${navOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">$</span>
          <span className="sidebar-brand-name">Controle Financeiro</span>
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
          {routeTour && (
            <button
              type="button"
              className="topbar-help-btn"
              onClick={() => startTour(routeTour.id)}
              aria-label="Rever tutorial"
              title="Rever tutorial"
            >
              <HelpCircle size={18} />
            </button>
          )}
          <span className="topbar-user">Olá, {user?.name?.split(" ")[0]}</span>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>

      {routeTour && (
        <Joyride
          steps={routeTour.steps}
          run={activeTour === routeTour.id}
          options={{ buttons: ["back", "close", "primary", "skip"] }}
          locale={{ back: "Voltar", close: "Fechar", last: "Concluir", next: "Próximo", skip: "Pular" }}
          onEvent={(data: EventData) => {
            if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
              markTourSeen(routeTour.id);
            }
          }}
        />
      )}
    </div>
  );
}