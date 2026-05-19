const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seed completado (sin datos iniciales por ahora)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
