const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const { buildScopeWhere } = require("../utils/scope");

const router = express.Router();
router.use(authMiddleware);

// GET /dashboard/summary?scope=PERSONAL&month=7&year=2026
router.get("/summary", async (req, res) => {
  try {
    const where = await buildScopeWhere(req);
    const month = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const [wallets, movements, investments] = await Promise.all([
      prisma.wallet.findMany({ where }),
      prisma.movement.findMany({
        where: { ...where, date: { gte: start, lte: end } },
        include: { category: true },
      }),
      prisma.investment.findMany({ where }),
    ]);

    const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
    const totalIncome = movements.filter((m) => m.type === "INCOME").reduce((s, m) => s + Number(m.amount), 0);
    const totalExpense = movements.filter((m) => m.type === "EXPENSE").reduce((s, m) => s + Number(m.amount), 0);
    const totalInvested = investments.reduce((s, i) => s + Number(i.amount), 0);

    const expensesByCategory = {};
    movements
      .filter((m) => m.type === "EXPENSE")
      .forEach((m) => {
        const key = m.category?.name || "Sem categoria";
        expensesByCategory[key] = (expensesByCategory[key] || 0) + Number(m.amount);
      });

    return res.json({
      month,
      year,
      totalBalance,
      totalIncome,
      totalExpense,
      totalInvested,
      netResult: totalIncome - totalExpense,
      walletsCount: wallets.length,
      expensesByCategory,
      recentMovements: movements.slice(0, 10),
    });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao gerar resumo do dashboard." });
  }
});

module.exports = router;
