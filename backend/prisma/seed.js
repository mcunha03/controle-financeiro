// Script de seed opcional. Rode com: npm run prisma:seed
// Por padrão não faz nada, pois as categorias padrão já são criadas
// automaticamente no registro de cada usuário (veja src/auth/authRoutes.js).

async function main() {
  console.log("Seed executado. Nenhum dado padrão adicional configurado.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
