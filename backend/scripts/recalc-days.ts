import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function recalcDays(start: Date, end: Date): number {
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  const dow = last.getUTCDay();
  if (dow === 5) last.setUTCDate(last.getUTCDate() + 2);
  else if (dow === 6) last.setUTCDate(last.getUTCDate() + 1);

  let count = 0;
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  while (cur <= last) {
    count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

async function main() {
  const requests = await prisma.vacationRequest.findMany({
    where: { status: { in: ['APPROVED', 'PENDING'] } },
    include: { employee: true },
  });

  let updated = 0;
  for (const r of requests) {
    const newDays = recalcDays(r.startDate, r.endDate);
    if (newDays !== r.daysRequested) {
      await prisma.vacationRequest.update({
        where: { id: r.id },
        data: { daysRequested: newDays },
      });
      console.log(`  ${r.employee.firstName} ${r.employee.lastName}: ${r.daysRequested} → ${newDays} (${r.startDate.toISOString().slice(0, 10)} al ${r.endDate.toISOString().slice(0, 10)})`);
      updated++;
    }
  }
  console.log(`\nRecalculadas: ${updated} de ${requests.length} solicitudes activas.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
