const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const { buildScopeWhere, assertAccess, assertCanWriteToScope } = require("../utils/scope");

const router = express.Router();
router.use(authMiddleware);

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

// POST /investments
router.post("/", async (req, res) => {
  try {
    const { name, category, amount, yieldRate, broker, ticker, goalId, scope, familyGroupId } = req.body;
    if (!name || !category || amount === undefined) {
      return res.status(400).json({ error: "Nome, categoria e valor são obrigatórios." });
    }

    const resolvedScope = scope === "FAMILY" ? "FAMILY" : "PERSONAL";
    await assertCanWriteToScope(req, resolvedScope, familyGroupId);

    if (goalId) {
      const goal = await prisma.investmentGoal.findUnique({ where: { id: goalId } });
      if (!goal || goal.userId !== req.userId) {
        return res.status(403).json({ error: "Meta de investimento inválida." });
      }
    }

    const investment = await prisma.investment.create({
      data: {
        name,
        category,
        amount,
        yieldRate,
        broker,
        ticker,
        goalId: goalId || null,
        scope: resolvedScope,
        userId: req.userId,
        familyGroupId: resolvedScope === "FAMILY" ? familyGroupId : null,
      },
    });

    if (goalId) {
      await prisma.investmentGoal.update({
        where: { id: goalId },
        data: { currentAmount: { increment: Number(amount) } },
      });
    }

    return res.status(201).json(investment);
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

    const { name, amount, yieldRate, broker, ticker } = req.body;

    // Se o valor investido mudar e a movimentação estiver ligada a uma meta, ajusta o total da meta
    if (amount !== undefined && existing.goalId) {
      const delta = Number(amount) - Number(existing.amount);
      await prisma.investmentGoal.update({
        where: { id: existing.goalId },
        data: { currentAmount: { increment: delta } },
      });
    }

    const investment = await prisma.investment.update({
      where: { id: req.params.id },
      data: { name, amount, yieldRate, broker, ticker },
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

// --- Metas de investimento (sempre pessoais) ---

// GET /investments/goals/list
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

// POST /investments/goals
router.post("/goals", async (req, res) => {
  try {
    const { name, targetAmount } = req.body;
    if (!name || !targetAmount) return res.status(400).json({ error: "Nome e valor alvo são obrigatórios." });

    const goal = await prisma.investmentGoal.create({
      data: { name, targetAmount, userId: req.userId },
    });
    return res.status(201).json(goal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar meta." });
  }
});

// PUT /investments/goals/:id
router.put("/goals/:id", async (req, res) => {
  try {
    const existing = await prisma.investmentGoal.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(403).json({ error: "Você não tem permissão para acessar esta meta." });
    }

    const { name, targetAmount } = req.body;
    const goal = await prisma.investmentGoal.update({
      where: { id: req.params.id },
      data: { name, targetAmount },
    });
    return res.json(goal);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar meta." });
  }
});

// DELETE /investments/goals/:id
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
