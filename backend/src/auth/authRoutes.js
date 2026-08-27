const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Categorias padrão criadas automaticamente para cada novo usuário
const DEFAULT_CATEGORIES = [
  { name: "Alimentação", type: "EXPENSE", icon: "utensils", color: "#f97316" },
  { name: "Moradia", type: "EXPENSE", icon: "home", color: "#0ea5e9" },
  { name: "Transporte", type: "EXPENSE", icon: "car", color: "#6366f1" },
  { name: "Saúde", type: "EXPENSE", icon: "heart-pulse", color: "#ef4444" },
  { name: "Educação", type: "EXPENSE", icon: "book", color: "#22c55e" },
  { name: "Lazer", type: "EXPENSE", icon: "gamepad-2", color: "#a855f7" },
  { name: "Compras", type: "EXPENSE", icon: "shopping-bag", color: "#eab308" },
  { name: "Outros", type: "EXPENSE", icon: "more-horizontal", color: "#64748b" },
  { name: "Salário", type: "INCOME", icon: "wallet", color: "#16a34a" },
  { name: "Extra", type: "INCOME", icon: "plus-circle", color: "#059669" },
  { name: "Bico", type: "INCOME", icon: "briefcase", color: "#0d9488" },
];

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Já existe uma conta com este email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user.id, isDefault: true, scope: "PERSONAL" })),
    });

    const token = generateToken(user.id);
    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao registrar usuário." });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Email ou senha inválidos." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Email ou senha inválidos." });
    }

    const token = generateToken(user.id);
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao fazer login." });
  }
});

// GET /auth/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        memberships: {
          include: { familyGroup: true },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao buscar usuário." });
  }
});

// PUT /auth/me - atualizar perfil
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name },
    });
    return res.json({ id: user.id, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao atualizar perfil." });
  }
});

// PUT /auth/change-password
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "A nova senha deve ter no mínimo 6 caracteres." });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Senha atual incorreta." });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { passwordHash } });

    return res.json({ message: "Senha alterada com sucesso." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao alterar senha." });
  }
});

// POST /auth/family/create - cria um grupo familiar
router.post("/family/create", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Nome do grupo é obrigatório." });

    const familyGroup = await prisma.familyGroup.create({
      data: {
        name,
        members: { create: { userId: req.userId } },
      },
    });

    return res.status(201).json(familyGroup);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar grupo familiar." });
  }
});

// POST /auth/family/join - entra em um grupo familiar via código de convite
router.post("/family/join", authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const familyGroup = await prisma.familyGroup.findUnique({ where: { inviteCode } });
    if (!familyGroup) return res.status(404).json({ error: "Código de convite inválido." });

    const existing = await prisma.familyMembership.findUnique({
      where: { userId_familyGroupId: { userId: req.userId, familyGroupId: familyGroup.id } },
    });
    if (existing) return res.status(409).json({ error: "Você já faz parte deste grupo." });

    await prisma.familyMembership.create({
      data: { userId: req.userId, familyGroupId: familyGroup.id },
    });

    return res.status(201).json(familyGroup);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao entrar no grupo familiar." });
  }
});

module.exports = router;
