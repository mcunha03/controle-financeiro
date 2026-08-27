const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const { buildScopeWhere, assertAccess, assertCanWriteToScope } = require("../utils/scope");

const router = express.Router();
router.use(authMiddleware);

// GET /wallets
router.get("/", async (req, res) => {
  try {
    const where = await buildScopeWhere(req);
    const wallets = await prisma.wallet.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });
    return res.json(wallets);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao listar carteiras." });
  }
});

// POST /wallets
router.post("/", async (req, res) => {
  try {
    const { name, type, balance, scope, familyGroupId } = req.body;
    if (!name) return res.status(400).json({ error: "Nome da carteira é obrigatório." });

    const resolvedScope = scope === "FAMILY" ? "FAMILY" : "PERSONAL";
    await assertCanWriteToScope(req, resolvedScope, familyGroupId);

    const wallet = await prisma.wallet.create({
      data: {
        name,
        type: type || "checking",
        balance: balance || 0,
        scope: resolvedScope,
        userId: req.userId,
        familyGroupId: resolvedScope === "FAMILY" ? familyGroupId : null,
      },
    });
    return res.status(201).json(wallet);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao criar carteira." });
  }
});

// PUT /wallets/:id
router.put("/:id", async (req, res) => {
  try {
    const existing = await prisma.wallet.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    const { name, type, balance } = req.body;
    const wallet = await prisma.wallet.update({
      where: { id: req.params.id },
      data: { name, type, balance },
    });
    return res.json(wallet);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao atualizar carteira." });
  }
});

// DELETE /wallets/:id
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.wallet.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    await prisma.wallet.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao excluir carteira." });
  }
});

module.exports = router;
