import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@canaldirecto.com' } });
  if (existing) {
    console.log('La base de datos ya contiene el admin. Seed omitido.');
    return;
  }

  const adminPass = await bcrypt.hash('Admin123!', 10);
  await prisma.user.create({
    data: { email: 'admin@canaldirecto.com', password: adminPass, role: Role.ADMIN },
  });

  console.log('Admin creado: admin@canaldirecto.com / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
