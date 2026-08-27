const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const { buildScopeWhere, assertAccess, assertCanWriteToScope } = require("../utils/scope");

const router = express.Router();
router.use(authMiddleware);

// GET /fixed-bills
router.get("/", async (req, res) => {
  try {
    const where = await buildScopeWhere(req);
    const bills = await prisma.fixedBill.findMany({ where, orderBy: { dueDay: "asc" } });
    return res.json(bills);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao listar contas fixas." });
  }
});

// GET /fixed-bills/upcoming
// Retorna contas fixas com vencimento nos próximos 7 dias (para notificação in-app)
router.get("/upcoming", async (req, res) => {
  try {
    const where = await buildScopeWhere(req);
    const bills = await prisma.fixedBill.findMany({ where: { ...where, active: true } });

    const today = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    const upcoming = bills.filter((bill) => {
      let diff = bill.dueDay - today;
      if (diff < 0) diff += daysInMonth; // vence no próximo mês
      return diff >= 0 && diff <= 7;
    });

    return res.json(upcoming);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao buscar contas próximas do vencimento." });
  }
});

// POST /fixed-bills
router.post("/", async (req, res) => {
  try {
    const { name, amount, dueDay, category, scope, familyGroupId } = req.body;
    if (!name || !amount || !dueDay) {
      return res.status(400).json({ error: "Nome, valor e dia de vencimento são obrigatórios." });
    }

    const resolvedScope = scope === "FAMILY" ? "FAMILY" : "PERSONAL";
    await assertCanWriteToScope(req, resolvedScope, familyGroupId);

    const bill = await prisma.fixedBill.create({
      data: {
        name,
        amount,
        dueDay: Number(dueDay),
        category,
        scope: resolvedScope,
        userId: req.userId,
        familyGroupId: resolvedScope === "FAMILY" ? familyGroupId : null,
      },
    });
    return res.status(201).json(bill);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao criar conta fixa." });
  }
});

// PUT /fixed-bills/:id
router.put("/:id", async (req, res) => {
  try {
    const existing = await prisma.fixedBill.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    const { name, amount, dueDay, category, active } = req.body;
    const bill = await prisma.fixedBill.update({
      where: { id: req.params.id },
      data: { name, amount, dueDay, category, active },
    });
    return res.json(bill);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao atualizar conta fixa." });
  }
});

// DELETE /fixed-bills/:id
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.fixedBill.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    await prisma.fixedBill.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao excluir conta fixa." });
  }
});

module.exports = router;
