const { PrismaClient } = require("@prisma/client");

// Instância única do Prisma reutilizada em toda a aplicação
const prisma = new PrismaClient();

module.exports = prisma;
