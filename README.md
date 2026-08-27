# Razão — Controle Financeiro

App de controle financeiro pessoal e familiar. Frontend em React + TypeScript
(PWA), backend em Node.js/Express com Prisma e PostgreSQL.

## Estrutura

```
backend/     API REST (Express + Prisma + JWT)
frontend/    App React (Vite + TypeScript), PWA
docker-compose.yml   Sobe um PostgreSQL local
```

## Pré-requisitos

- Node.js 18 ou superior
- Docker (recomendado, para o PostgreSQL) — ou um PostgreSQL já instalado

## 1. Banco de dados

Com Docker instalado, na raiz do projeto:

```bash
docker compose up -d
```

Isso sobe um PostgreSQL em `localhost:5432` com usuário `postgres`, senha
`postgres` e banco `controle_financeiro` (já compatível com o `.env.example`
do backend). Se preferir usar um PostgreSQL que você já tem instalado, só
ajuste `DATABASE_URL` no passo abaixo.

## 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run dev
```

- `npm run prisma:migrate` cria as tabelas no banco (pede um nome para a
  migração na primeira vez — pode ser algo como "init").
- O servidor sobe em `http://localhost:3333`.
- `npm run prisma:studio` abre uma interface visual para ver os dados do
  banco, se quiser conferir.

## 3. Frontend

Em um novo terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- O app abre em `http://localhost:5173`.
- Crie uma conta pela tela de registro — categorias padrão (Alimentação,
  Moradia, Transporte etc.) já são criadas automaticamente.

## Uso do perfil família

Em qualquer tela, no topo, dá para alternar entre "Pessoal" e um perfil de
família. Para criar um grupo familiar ou entrar em um existente, use o botão
"+ Família" no seletor de perfil, ou a seção correspondente em
Configurações (onde também fica o código de convite para compartilhar).

## O que já funciona

- Cadastro/login com JWT, perfil e troca de senha
- Perfil pessoal (privado) e perfil família (compartilhado, mostrando quem
  lançou cada movimentação)
- Carteiras, com saldo atualizado automaticamente a cada lançamento
- Movimentações (receitas/despesas), com parcelamento, recorrência e forma
  de pagamento
- Cartões de crédito, com fatura aberta/fechada calculada automaticamente a
  partir do dia de fechamento
- Investimentos separados do saldo de conta, com metas de investimento
- Categorias (padrão + personalizadas) e orçamento mensal por categoria
- Contas fixas recorrentes com aviso de vencimento próximo (7 dias)
- Dashboard com indicadores do mês e despesas por categoria
- Relatórios (receitas x despesas, orçado x realizado)
- Busca global por movimentações, carteiras, cartões e investimentos
- PWA instalável no celular (ícone na tela inicial)

## Próximos passos (fora do escopo desta primeira versão)

Conforme o próprio resumo do projeto já previa como evolução futura:
gráficos mais ricos, exportação em PDF/Excel, notificação push fora do
app, sincronização/uso offline completo, testes automatizados, auditoria,
CI/CD e monitoramento.

## Solução de problemas

- **Erro de conexão com o banco**: confira se o PostgreSQL está rodando
  (`docker compose ps`) e se `DATABASE_URL` no `backend/.env` está correto.
- **Erro 401 constante no frontend**: o token expira em 7 dias por padrão
  (`JWT_EXPIRES_IN` no `backend/.env`); basta fazer login novamente.
- **Porta em uso**: mude `PORT` no `backend/.env` ou a porta do Vite em
  `frontend/vite.config.ts`, e atualize `VITE_API_URL`/`FRONTEND_URL`
  correspondentes.
