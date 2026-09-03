const express = require("express");
const { randomUUID } = require("crypto");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const { buildScopeWhere, assertAccess, assertCanWriteToScope } = require("../utils/scope");

const router = express.Router();
router.use(authMiddleware);

// GET /movements?scope=PERSONAL&from=2026-07-01&to=2026-07-31&categoryId=&walletId=&cardId=
router.get("/", async (req, res) => {
  try {
    const where = await buildScopeWhere(req);
    const { from, to, categoryId, walletId, cardId, type } = req.query;

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    if (categoryId) where.categoryId = categoryId;
    if (walletId) where.walletId = walletId;
    if (cardId) where.cardId = cardId;
    if (type) where.type = type;

    const movements = await prisma.movement.findMany({
      where,
      include: { category: true, wallet: true, card: true, user: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    });
    return res.json(movements);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao listar movimentações." });
  }
});

// POST /movements
// Cria uma movimentação. Se "installments" > 1, gera uma movimentação por parcela.
// Se tiver walletId (e não for no cartão), atualiza o saldo da carteira.
router.post("/", async (req, res) => {
  try {
    const {
      description,
      amount,
      type,
      date,
      paymentMethod,
      isRecurring,
      installments,
      walletId,
      categoryId,
      cardId,
      scope,
      familyGroupId,
    } = req.body;

    if (!description || !amount || !type) {
      return res.status(400).json({ error: "Descrição, valor e tipo são obrigatórios." });
    }

    const resolvedScope = scope === "FAMILY" ? "FAMILY" : "PERSONAL";
    await assertCanWriteToScope(req, resolvedScope, familyGroupId);

    // Garante que a carteira, o cartão e a categoria informados realmente pertencem
    // ao usuário (ou ao grupo familiar dele) - evita alterar saldo de terceiros.
    let wallet = null;
    if (walletId) {
      wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      await assertAccess(req, wallet);
    }
    if (cardId) {
      const card = await prisma.card.findUnique({ where: { id: cardId } });
      await assertAccess(req, card);
    }
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      await assertAccess(req, category);
    }

    const numInstallments = installments && installments > 1 ? Number(installments) : 1;
    const installmentGroupId = numInstallments > 1 ? randomUUID() : null;
    const baseDate = date ? new Date(date) : new Date();
    const installmentAmount = Number(amount) / numInstallments;

    const createdMovements = [];

    for (let i = 0; i < numInstallments; i++) {
      const movementDate = new Date(baseDate);
      movementDate.setMonth(movementDate.getMonth() + i);

      const movement = await prisma.movement.create({
        data: {
          description: numInstallments > 1 ? `${description} (${i + 1}/${numInstallments})` : description,
          amount: installmentAmount,
          type,
          date: movementDate,
          paymentMethod: paymentMethod || "OTHER",
          isRecurring: !!isRecurring,
          installments: numInstallments,
          installmentOf: installmentGroupId,
          walletId: walletId || null,
          categoryId: categoryId || null,
          cardId: cardId || null,
          userId: req.userId,
          scope: resolvedScope,
          familyGroupId: resolvedScope === "FAMILY" ? familyGroupId : null,
        },
      });
      createdMovements.push(movement);
    }

    // Atualiza o saldo da carteira apenas para a primeira parcela (se não for no cartão)
    if (wallet && !cardId) {
      const delta = type === "INCOME" ? Number(amount) : -Number(amount);
      await prisma.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: delta } },
      });
    }

    return res.status(201).json(numInstallments > 1 ? createdMovements : createdMovements[0]);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao criar movimentação." });
  }
});

// PUT /movements/:id
router.put("/:id", async (req, res) => {
  try {
    const existing = await prisma.movement.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    const { description, amount, date, categoryId, paymentMethod } = req.body;

    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      await assertAccess(req, category);
    }

    // Se o valor mudar e estiver ligado a uma carteira (sem ser cartão), ajusta o saldo
    if (amount !== undefined && existing.walletId && !existing.cardId) {
      const oldDelta = existing.type === "INCOME" ? Number(existing.amount) : -Number(existing.amount);
      const newDelta = existing.type === "INCOME" ? Number(amount) : -Number(amount);
      await prisma.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: newDelta - oldDelta } },
      });
    }

    const movement = await prisma.movement.update({
      where: { id: req.params.id },
      data: {
        description,
        amount,
        date: date ? new Date(date) : undefined,
        categoryId,
        paymentMethod,
      },
    });
    return res.json(movement);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao atualizar movimentação." });
  }
});

// PUT /movements/installment-groups/:installmentOf
// Atualiza descrição e/ou categoria de TODAS as parcelas de uma compra parcelada de uma vez.
// Mantém o sufixo "(i/n)" de cada parcela ao trocar a descrição.
router.put("/installment-groups/:installmentOf", async (req, res) => {
  try {
    const movements = await prisma.movement.findMany({ where: { installmentOf: req.params.installmentOf } });
    if (movements.length === 0) {
      return res.status(404).json({ error: "Compra parcelada não encontrada." });
    }
    for (const m of movements) {
      await assertAccess(req, m);
    }

    const { description, categoryId } = req.body;

    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      await assertAccess(req, category);
    }

    const updated = [];
    for (const m of movements) {
      const suffixMatch = m.description.match(/\s\(\d+\/\d+\)$/);
      const suffix = suffixMatch ? suffixMatch[0] : "";

      const data = {};
      if (description !== undefined && description.trim() !== "") {
        data.description = `${description.trim()}${suffix}`;
      }
      if (categoryId !== undefined) {
        data.categoryId = categoryId || null;
      }

      const movement = await prisma.movement.update({ where: { id: m.id }, data });
      updated.push(movement);
    }

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao atualizar compra parcelada." });
  }
});

// DELETE /movements/:id
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.movement.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    if (existing.walletId && !existing.cardId) {
      const delta = existing.type === "INCOME" ? -Number(existing.amount) : Number(existing.amount);
      await prisma.wallet.update({
        where: { id: existing.walletId },
        data: { balance: { increment: delta } },
      });
    }

    await prisma.movement.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao excluir movimentação." });
  }
});

module.exports = router;
