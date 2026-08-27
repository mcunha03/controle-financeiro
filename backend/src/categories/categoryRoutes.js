const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const { buildScopeWhere, assertAccess, assertCanWriteToScope } = require("../utils/scope");

const router = express.Router();
router.use(authMiddleware);

// GET /categories?type=EXPENSE
router.get("/", async (req, res) => {
  try {
    const where = await buildScopeWhere(req);
    if (req.query.type) where.type = req.query.type;

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return res.json(categories);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao listar categorias." });
  }
});

// POST /categories
router.post("/", async (req, res) => {
  try {
    const { name, type, icon, color, scope, familyGroupId } = req.body;
    if (!name || !type) return res.status(400).json({ error: "Nome e tipo são obrigatórios." });

    const resolvedScope = scope === "FAMILY" ? "FAMILY" : "PERSONAL";
    await assertCanWriteToScope(req, resolvedScope, familyGroupId);

    const category = await prisma.category.create({
      data: {
        name,
        type,
        icon,
        color,
        scope: resolvedScope,
        userId: req.userId,
        familyGroupId: resolvedScope === "FAMILY" ? familyGroupId : null,
      },
    });
    return res.status(201).json(category);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao criar categoria." });
  }
});

// PUT /categories/:id
router.put("/:id", async (req, res) => {
  try {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    const { name, icon, color } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, icon, color },
    });
    return res.json(category);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao atualizar categoria." });
  }
});

// DELETE /categories/:id
router.delete("/:id", async (req, res) => {
  try {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    await assertAccess(req, existing);

    if (existing.isDefault) {
      return res.status(400).json({ error: "Categorias padrão não podem ser excluídas, apenas editadas." });
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao excluir categoria." });
  }
});

// --- Orçamentos (budgets) por categoria/mês ---

// GET /categories/budgets/list?month=7&year=2026
router.get("/budgets/list", async (req, res) => {
  try {
    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);
    const where = await buildScopeWhere(req);

    const budgets = await prisma.budget.findMany({
      where: { month, year, category: where },
      include: { category: true },
    });
    return res.json(budgets);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || "Erro ao listar orçamentos." });
  }
});

// POST /categories/budgets/set
router.post("/budgets/set", async (req, res) => {
  try {
    const { categoryId, month, year, limit } = req.body;
    if (!categoryId || !month || !year || limit === undefined) {
      return res.status(400).json({ error: "Categoria, mês, ano e limite são obrigatórios." });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    await assertAccess(req, category);

    const budget = await prisma.budget.upsert({
      where: { categoryId_month_year: { categoryId, month: Number(month), year: Number(year) } },
      update: { limit },
      create: { categoryId, month: Number(month), year: Number(year), limit },
    });
    return res.status(201).json(budget);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao definir orçamento." });
  }
});

module.exports = router;
