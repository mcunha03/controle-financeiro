const prisma = require("../prismaClient");

// Confirma que o usuário logado realmente pertence ao grupo familiar informado.
async function checkMembership(userId, familyGroupId) {
  const membership = await prisma.familyMembership.findUnique({
    where: { userId_familyGroupId: { userId, familyGroupId } },
  });
  if (!membership) {
    const error = new Error("Você não faz parte deste grupo familiar.");
    error.status = 403;
    throw error;
  }
}

// Monta o filtro de escopo (pessoal ou família) usado em quase todos os módulos.
// O frontend envia ?scope=PERSONAL ou ?scope=FAMILY&familyGroupId=xxx
// IMPORTANTE: valida que o usuário logado realmente pertence ao grupo antes de
// devolver o filtro - sem isso, qualquer usuário autenticado poderia ler dados
// de qualquer família só adivinhando/informando um familyGroupId.
async function buildScopeWhere(req) {
  const scope = (req.query.scope || "PERSONAL").toUpperCase();

  if (scope === "FAMILY") {
    const familyGroupId = req.query.familyGroupId;
    if (!familyGroupId) {
      const error = new Error("familyGroupId é obrigatório para escopo FAMILY.");
      error.status = 400;
      throw error;
    }
    await checkMembership(req.userId, familyGroupId);
    return { scope: "FAMILY", familyGroupId };
  }

  return { scope: "PERSONAL", userId: req.userId };
}

// Usado nos POST (criação) quando scope=FAMILY, antes de gravar o registro.
async function assertCanWriteToScope(req, scope, familyGroupId) {
  if (scope === "FAMILY") {
    if (!familyGroupId) {
      const error = new Error("familyGroupId é obrigatório para escopo FAMILY.");
      error.status = 400;
      throw error;
    }
    await checkMembership(req.userId, familyGroupId);
  }
}

// Usado nos PUT/DELETE de um registro já existente: confirma que o usuário logado
// é o dono (escopo pessoal) ou pertence ao grupo familiar (escopo família) do registro.
async function assertAccess(req, record) {
  if (!record) {
    const error = new Error("Registro não encontrado.");
    error.status = 404;
    throw error;
  }
  if (record.scope === "FAMILY") {
    await checkMembership(req.userId, record.familyGroupId);
  } else if (record.userId !== req.userId) {
    const error = new Error("Você não tem permissão para acessar este item.");
    error.status = 403;
    throw error;
  }
}

module.exports = { buildScopeWhere, assertAccess, assertCanWriteToScope };
