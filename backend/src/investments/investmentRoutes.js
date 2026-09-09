const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const { buildScopeWhere, assertAccess, assertCanWriteToScope } = require("../utils/scope");

const router = express.Router();
router.use(authMiddleware);

const TX_TYPES = ["BUY", "SELL"];
const INCOME_TYPES = ["DIVIDEND", "JCP", "RENDIMENTO"];
const CATEGORIES = ["fixed_income", "stocks", "emergency_reserve", "FII", "ETF", "crypto", "custom"];

// Converte "", undefined, null em `undefined` (Prisma ignora o campo no create/update)
// e qualquer outro valor em Number. Evita o erro "Expected Decimal, provided String".
function toDecimalOrUndefined(value) {
  if (value === "" || value === undefined || value === null) return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

// Recalcula quantidade, preço médio e valor aportado (amount) de uma posição a
// partir do histórico completo de transações (custo médio ponderado). Também
// ajusta a meta vinculada, se houver, pela diferença entre o amount antigo e o novo.
async function recalculatePosition(investmentId) {
  const investment = await prisma.investment.findUnique({ where: { id: investmentId } });
  if (!investment) return null;

  const transactions = await prisma.investmentTransaction.findMany({
    where: { investmentId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  let quantity = 0;
  let avgPrice = 0;

  for (const tx of transactions) {
    const txQty = Number(tx.quantity);
    const txPrice = Number(tx.unitPrice);
    const txFees = Number(tx.fees || 0);

    if (tx.type === "BUY") {
      const totalCost = quantity * avgPrice + txQty * txPrice + txFees;
      quantity += txQty;
      avgPrice = quantity > 0 ? totalCost / quantity : 0;
    } else {
      quantity = Math.max(0, quantity - txQty);
    }
  }

  const newAmount = quantity * avgPrice;
  const oldAmount = Number(investment.amount);

  const updated = await prisma.investment.update({
    where: { id: investmentId },
    data: { quantity, avgPrice, amount: newAmount },
  });

  if (investment.goalId) {
    const delta = newAmount - oldAmount;
    if (delta !== 0) {
      await prisma.investmentGoal.update({
        where: { id: investment.goalId },
        data: { currentAmount: { increment: delta } },
      });
    }
  }

  return updated;
}

// GET /investments
router.get("/", async (req, res) => {
  try {
    const where = await buildScopeWhere(req);
    const investments = await prisma.investment.findMany({
      where,
      include: { goal: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json(investments);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao listar investimentos." });
  }
});

// GET /investments/:id
router.get("/:id", async (req, res) => {
  try {
    const investment = await prisma.investment.findUnique({
      where: { id: req.params.id },
      include: {
        goal: true,
        transactions: { orderBy: { date: "desc" } },
        incomes: { orderBy: { date: "desc" } },
      },
    });
    await assertAccess(req, investment);

    const totalIncome = investment.incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const income12m = investment.incomes
      .filter((i) => new Date(i.date) >= oneYearAgo)
      .reduce((sum, i) => sum + Number(i.amount), 0);
    const amount = Number(investment.amount);
    const dividendYieldOnCost = amount > 0 ? (income12m / amount) * 100 : 0;

    return res.json({ ...investment, summary: { totalIncome, income12m, dividendYieldOnCost } });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao buscar investimento." });
  }
});

// POST /investments
router.post("/", async (req, res) => {
  try {
    const { name, category, amount, quantity, unitPrice, yieldRate, broker, ticker, goalId, scope, familyGroupId } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: "Nome e categoria são obrigatórios." });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Categoria inválida." });
    }

    const resolvedScope = scope === "FAMILY" ? "FAMILY" : "PERSONAL";
    await assertCanWriteToScope(req, resolvedScope, familyGroupId);

    if (goalId) {
      const goal = await prisma.investmentGoal.findUnique({ where: { id: goalId } });
      if (!goal || goal.userId !== req.userId) {
        return res.status(403).json({ error: "Meta de investimento inválida." });
      }
    }

    const hasTicker = Boolean(ticker);

    if (!hasTicker && isEmpty(amount)) {
      return res.status(400).json({ error: "Valor é obrigatório para investimentos sem ticker." });
    }
    if (hasTicker && (isEmpty(quantity) || isEmpty(unitPrice))) {
      return res.status(400).json({ error: "Quantidade e preço de compra são obrigatórios para ativos com ticker." });
    }

    const initialAmount = hasTicker ? 0 : (toDecimalOrUndefined(amount) ?? 0);

    const investment = await prisma.investment.create({
      data: {
        name,
        category,
        amount: initialAmount,
        quantity: hasTicker ? 0 : null,
        avgPrice: hasTicker ? 0 : null,
        yieldRate: toDecimalOrUndefined(yieldRate),
        broker: broker || null,
        ticker: ticker || null,
        goalId: goalId || null,
        scope: resolvedScope,
        userId: req.userId,
        familyGroupId: resolvedScope === "FAMILY" ? familyGroupId : null,
      },
    });

    let result = investment;

    if (hasTicker) {
      // Lança a compra inicial como transação, mantendo consistência com o
      // histórico que recalculatePosition usa para recalcular a posição.
      await prisma.investmentTransaction.create({
        data: {
          investmentId: investment.id,
          type: "BUY",
          quantity: toDecimalOrUndefined(quantity),
          unitPrice: toDecimalOrUndefined(unitPrice),
          fees: 0,
          date: new Date(),
        },
      });
      result = await recalculatePosition(investment.id);
    } else if (goalId && initialAmount) {
      await prisma.investmentGoal.update({
        where: { id: goalId },
        data: { currentAmount: { increment: initialAmount } },
      });
    }

    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao criar investimento." });
  }
});

// PUT /investments/:id
router.put("/:id", async (req, res) => {
  try {
    const existing = await prisma.investment.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    const { name, amount, yieldRate, broker, goalId } = req.body;
    const hasTicker = Boolean(existing.ticker);
    const nextGoalId = goalId === undefined ? existing.goalId : (goalId || null);

    const data = {
      name,
      yieldRate: toDecimalOrUndefined(yieldRate),
      broker: broker || null,
      goalId: nextGoalId,
    };

    if (!hasTicker) {
      const nextAmount = isEmpty(amount) ? Number(existing.amount) : Number(amount);
      data.amount = nextAmount;

      // Estorna da meta antiga (se havia) e credita na meta nova (se houver),
      // cobrindo tanto mudança de valor quanto troca de meta.
      if (existing.goalId && existing.goalId !== nextGoalId) {
        await prisma.investmentGoal.update({
          where: { id: existing.goalId },
          data: { currentAmount: { decrement: Number(existing.amount) } },
        });
        if (nextGoalId) {
          await prisma.investmentGoal.update({
            where: { id: nextGoalId },
            data: { currentAmount: { increment: nextAmount } },
          });
        }
      } else if (existing.goalId && existing.goalId === nextGoalId) {
        const delta = nextAmount - Number(existing.amount);
        if (delta !== 0) {
          await prisma.investmentGoal.update({
            where: { id: existing.goalId },
            data: { currentAmount: { increment: delta } },
          });
        }
      } else if (!existing.goalId && nextGoalId) {
        await prisma.investmentGoal.update({
          where: { id: nextGoalId },
          data: { currentAmount: { increment: nextAmount } },
        });
      }
    }

    const investment = await prisma.investment.update({
      where: { id: req.params.id },
      data,
    });
    return res.json(investment);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao atualizar investimento." });
  }
});

// DELETE /investments/:id
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.investment.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    if (existing.goalId) {
      await prisma.investmentGoal.update({
        where: { id: existing.goalId },
        data: { currentAmount: { decrement: Number(existing.amount) } },
      });
    }

    await prisma.investment.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao excluir investimento." });
  }
});

// --- Transações (compra/venda) de uma posição ---

router.get("/:investmentId/transactions", async (req, res) => {
  try {
    const investment = await prisma.investment.findUnique({ where: { id: req.params.investmentId } });
    await assertAccess(req, investment);

    const transactions = await prisma.investmentTransaction.findMany({
      where: { investmentId: req.params.investmentId },
      orderBy: { date: "desc" },
    });
    return res.json(transactions);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao listar transações." });
  }
});

router.post("/:investmentId/transactions", async (req, res) => {
  try {
    const investment = await prisma.investment.findUnique({ where: { id: req.params.investmentId } });
    await assertAccess(req, investment);

    const { type, quantity, unitPrice, fees, date } = req.body;
    if (!TX_TYPES.includes(type)) {
      return res.status(400).json({ error: "Tipo deve ser BUY ou SELL." });
    }
    if (isEmpty(quantity) || isEmpty(unitPrice) || isEmpty(date)) {
      return res.status(400).json({ error: "Quantidade, preço unitário e data são obrigatórios." });
    }
    if (type === "SELL" && Number(quantity) > Number(investment.quantity || 0)) {
      return res.status(400).json({ error: "Quantidade de venda maior que a posição atual." });
    }

    await prisma.investmentTransaction.create({
      data: {
        investmentId: req.params.investmentId,
        type,
        quantity: toDecimalOrUndefined(quantity),
        unitPrice: toDecimalOrUndefined(unitPrice),
        fees: toDecimalOrUndefined(fees) ?? 0,
        date: new Date(date),
      },
    });

    const updated = await recalculatePosition(req.params.investmentId);
    return res.status(201).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao lançar transação." });
  }
});

router.put("/transactions/:id", async (req, res) => {
  try {
    const tx = await prisma.investmentTransaction.findUnique({ where: { id: req.params.id } });
    if (!tx) return res.status(404).json({ error: "Transação não encontrada." });
    const investment = await prisma.investment.findUnique({ where: { id: tx.investmentId } });
    await assertAccess(req, investment);

    const { type, quantity, unitPrice, fees, date } = req.body;
    if (type && !TX_TYPES.includes(type)) {
      return res.status(400).json({ error: "Tipo deve ser BUY ou SELL." });
    }

    await prisma.investmentTransaction.update({
      where: { id: req.params.id },
      data: {
        type,
        quantity: toDecimalOrUndefined(quantity),
        unitPrice: toDecimalOrUndefined(unitPrice),
        fees: toDecimalOrUndefined(fees),
        date: date ? new Date(date) : undefined,
      },
    });

    const updated = await recalculatePosition(tx.investmentId);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao atualizar transação." });
  }
});

router.delete("/transactions/:id", async (req, res) => {
  try {
    const tx = await prisma.investmentTransaction.findUnique({ where: { id: req.params.id } });
    if (!tx) return res.status(404).json({ error: "Transação não encontrada." });
    const investment = await prisma.investment.findUnique({ where: { id: tx.investmentId } });
    await assertAccess(req, investment);

    await prisma.investmentTransaction.delete({ where: { id: req.params.id } });
    const updated = await recalculatePosition(tx.investmentId);
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao excluir transação." });
  }
});

// --- Proventos (dividendos/JCP/rendimentos) de uma posição ---

router.get("/:investmentId/incomes", async (req, res) => {
  try {
    const investment = await prisma.investment.findUnique({ where: { id: req.params.investmentId } });
    await assertAccess(req, investment);

    const incomes = await prisma.investmentIncome.findMany({
      where: { investmentId: req.params.investmentId },
      orderBy: { date: "desc" },
    });
    return res.json(incomes);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao listar proventos." });
  }
});

router.post("/:investmentId/incomes", async (req, res) => {
  try {
    const investment = await prisma.investment.findUnique({ where: { id: req.params.investmentId } });
    await assertAccess(req, investment);

    const { type, amount, date } = req.body;
    if (!INCOME_TYPES.includes(type)) {
      return res.status(400).json({ error: "Tipo deve ser DIVIDEND, JCP ou RENDIMENTO." });
    }
    if (isEmpty(amount) || isEmpty(date)) {
      return res.status(400).json({ error: "Valor e data são obrigatórios." });
    }

    const income = await prisma.investmentIncome.create({
      data: {
        investmentId: req.params.investmentId,
        type,
        amount: toDecimalOrUndefined(amount),
        date: new Date(date),
      },
    });
    return res.status(201).json(income);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao lançar provento." });
  }
});

router.put("/incomes/:id", async (req, res) => {
  try {
    const income = await prisma.investmentIncome.findUnique({ where: { id: req.params.id } });
    if (!income) return res.status(404).json({ error: "Provento não encontrado." });
    const investment = await prisma.investment.findUnique({ where: { id: income.investmentId } });
    await assertAccess(req, investment);

    const { type, amount, date } = req.body;
    if (type && !INCOME_TYPES.includes(type)) {
      return res.status(400).json({ error: "Tipo deve ser DIVIDEND, JCP ou RENDIMENTO." });
    }

    const updated = await prisma.investmentIncome.update({
      where: { id: req.params.id },
      data: {
        type,
        amount: toDecimalOrUndefined(amount),
        date: date ? new Date(date) : undefined,
      },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao atualizar provento." });
  }
});

router.delete("/incomes/:id", async (req, res) => {
  try {
    const income = await prisma.investmentIncome.findUnique({ where: { id: req.params.id } });
    if (!income) return res.status(404).json({ error: "Provento não encontrado." });
    const investment = await prisma.investment.findUnique({ where: { id: income.investmentId } });
    await assertAccess(req, investment);

    await prisma.investmentIncome.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao excluir provento." });
  }
});

// --- Metas de investimento (sempre pessoais) ---

router.get("/goals/list", async (req, res) => {
  try {
    const goals = await prisma.investmentGoal.findMany({
      where: { userId: req.userId },
      include: { investments: true },
      orderBy: { createdAt: "asc" },
    });
    return res.json(goals);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao listar metas." });
  }
});

router.post("/goals", async (req, res) => {
  try {
    const { name, targetAmount } = req.body;
    if (!name || isEmpty(targetAmount)) return res.status(400).json({ error: "Nome e valor alvo são obrigatórios." });

    const goal = await prisma.investmentGoal.create({
      data: { name, targetAmount: toDecimalOrUndefined(targetAmount), userId: req.userId },
    });
    return res.status(201).json(goal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar meta." });
  }
});

router.put("/goals/:id", async (req, res) => {
  try {
    const existing = await prisma.investmentGoal.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(403).json({ error: "Você não tem permissão para acessar esta meta." });
    }

    const { name, targetAmount } = req.body;
    const goal = await prisma.investmentGoal.update({
      where: { id: req.params.id },
      data: { name, targetAmount: toDecimalOrUndefined(targetAmount) },
    });
    return res.json(goal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar meta." });
  }
});

router.delete("/goals/:id", async (req, res) => {
  try {
    const existing = await prisma.investmentGoal.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(403).json({ error: "Você não tem permissão para acessar esta meta." });
    }

    await prisma.investmentGoal.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao excluir meta." });
  }
});

module.exports = router;