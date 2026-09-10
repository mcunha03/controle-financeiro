import type { Step } from "react-joyride";
import type { TourId } from "../contexts/TutorialContext";

interface RouteTour {
  id: TourId;
  steps: Step[];
}

export const ROUTE_TOURS: Record<string, RouteTour> = {
  "/": {
    id: "geral",
    steps: [
      { target: ".sidebar-brand", content: "Esse é o Controle Financeiro. Pelo menu ao lado você acessa carteiras, movimentações, cartões e mais." },
      { target: ".sidebar-nav", content: "Aqui fica toda a navegação entre as áreas do app." },
      { target: ".scope-switch", content: "Alterne aqui entre seu perfil Pessoal e um grupo Família compartilhado." },
      { target: ".kpi-grid", content: "No Painel você vê saldo, receitas, despesas e investimentos do mês." },
      { target: ".panel-grid", content: "E aqui, o detalhamento por categoria e suas últimas movimentações." },
    ],
  },
  "/carteiras": {
    id: "carteiras",
    steps: [
      { target: ".page-header", content: "Clique em \"Nova carteira\" para cadastrar uma conta, poupança ou dinheiro em espécie." },
      { target: ".card-grid", content: "Suas carteiras aparecem aqui, com o saldo atual de cada uma." },
    ],
  },
};