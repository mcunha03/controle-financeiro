const express = require("express");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");
const { buildScopeWhere } = require("../utils/scope");

const router = express.Router();
router.use(authMiddleware);

// GET /search?q=mercado&scope=PERSONAL
// Busca por movimentações, carteiras, cartões e investimentos que combinem com o termo
router.get("/", async (req, res) => {
  try {
    const q = req.query.q || "";
    if (!q) return res.json({ movements: [], wallets: [], cards: [], investments: [] });

    const where = await buildScopeWhere(req);

    const [movements, wallets, cards, investments] = await Promise.all([
      prisma.movement.findMany({
        where: { ...where, description: { contains: q, mode: "insensitive" } },
        take: 20,
        include: { category: true },
      }),
      prisma.wallet.findMany({
        where: { ...where, name: { contains: q, mode: "insensitive" } },
      }),
      prisma.card.findMany({
        where: { ...where, name: { contains: q, mode: "insensitive" } },
      }),
      prisma.investment.findMany({
        where: { ...where, name: { contains: q, mode: "insensitive" } },
      }),
    ]);

    return res.json({ movements, wallets, cards, investments });
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ error: err.message || "Erro ao pesquisar." });
  }
});

module.exports = router;
