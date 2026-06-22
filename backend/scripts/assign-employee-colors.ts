import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PALETTE = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
  '#e11d48', '#84cc16', '#0ea5e9', '#a855f7', '#d946ef',
  '#22d3ee',
];

async function main() {
  const employees = await prisma.employee.findMany({ orderBy: { createdAt: 'asc' } });
  let i = 0;
  for (const emp of employees) {
    const color = PALETTE[i % PALETTE.length];
    await prisma.employee.update({ where: { id: emp.id }, data: { color } });
    console.log(`  ${emp.firstName} ${emp.lastName} → ${color}`);
    i++;
  }
  console.log(`\nAsignados colores a ${employees.length} empleados.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
