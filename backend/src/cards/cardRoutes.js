const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const { buildScopeWhere, assertAccess, assertCanWriteToScope } = require("../utils/scope");

const router = express.Router();
router.use(authMiddleware);

// Calcula, com base no dia de fechamento, qual é o período (mês/ano de referência)
// da fatura em aberto para uma determinada data.
function getInvoicePeriod(date, closingDay) {
  const d = new Date(date);
  let month = d.getMonth() + 1;
  let year = d.getFullYear();

  if (d.getDate() > closingDay) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return { month, year };
}

// GET /cards
router.get("/", async (req, res) => {
  try {
    const where = await buildScopeWhere(req);
    const cards = await prisma.card.findMany({ where, orderBy: { createdAt: "asc" } });
    return res.json(cards);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao listar cartões." });
  }
});

// POST /cards
router.post("/", async (req, res) => {
  try {
    const { name, brand, closingDay, dueDay, limit, scope, familyGroupId } = req.body;
    if (!name || !closingDay || !dueDay || !limit) {
      return res.status(400).json({ error: "Nome, dia de fechamento, dia de vencimento e limite são obrigatórios." });
    }

    const resolvedScope = scope === "FAMILY" ? "FAMILY" : "PERSONAL";
    await assertCanWriteToScope(req, resolvedScope, familyGroupId);

    const card = await prisma.card.create({
      data: {
        name,
        brand,
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
        limit: Number(limit),
        scope: resolvedScope,
        userId: req.userId,
        familyGroupId: resolvedScope === "FAMILY" ? familyGroupId : null,
      },
    });
    return res.status(201).json(card);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao criar cartão." });
  }
});

// PUT /cards/:id
router.put("/:id", async (req, res) => {
  try {
    const existing = await prisma.card.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    const { name, brand, closingDay, dueDay, limit } = req.body;
    const card = await prisma.card.update({
      where: { id: req.params.id },
      data: { name, brand, closingDay, dueDay, limit },
    });
    return res.json(card);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao atualizar cartão." });
  }
});

// DELETE /cards/:id
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.card.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    await prisma.card.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao excluir cartão." });
  }
});

// GET /cards/:id/invoice?month=7&year=2026
// Retorna o total da fatura (aberta ou de um mês específico) calculado a partir das movimentações
router.get("/:id/invoice", async (req, res) => {
  try {
    const card = await prisma.card.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, card);

    const now = new Date();
    const referenceMonth = req.query.month ? parseInt(req.query.month) : getInvoicePeriod(now, card.closingDay).month;
    const referenceYear = req.query.year ? parseInt(req.query.year) : getInvoicePeriod(now, card.closingDay).year;

    const movements = await prisma.movement.findMany({
      where: { cardId: card.id },
    });

    const invoiceMovements = movements.filter((m) => {
      const period = getInvoicePeriod(m.date, card.closingDay);
      return period.month === referenceMonth && period.year === referenceYear;
    });

    const total = invoiceMovements.reduce((sum, m) => sum + Number(m.amount), 0);

    const isCurrentOpenInvoice =
      referenceMonth === getInvoicePeriod(now, card.closingDay).month &&
      referenceYear === getInvoicePeriod(now, card.closingDay).year;

    return res.json({
      cardId: card.id,
      referenceMonth,
      referenceYear,
      total,
      status: isCurrentOpenInvoice ? "OPEN" : "CLOSED",
      movements: invoiceMovements,
    });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao calcular fatura." });
  }
});

module.exports = router;
