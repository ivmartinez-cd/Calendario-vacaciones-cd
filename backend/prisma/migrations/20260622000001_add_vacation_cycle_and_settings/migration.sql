-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN IF NOT EXISTS "allowAdvanceRequest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "maxAdvanceDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "nextYearOpenDay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "nextYearOpenMonth" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE IF NOT EXISTS "VacationCycle" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "annualDays" INTEGER NOT NULL,
    "carryOver" INTEGER NOT NULL DEFAULT 0,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "VacationCycle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VacationCycle_year_idx" ON "VacationCycle"("year");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "VacationCycle_employeeId_idx" ON "VacationCycle"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VacationCycle_employeeId_year_key" ON "VacationCycle"("employeeId", "year");

-- AddForeignKey (safe check)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VacationCycle_employeeId_fkey'
  ) THEN
    ALTER TABLE "VacationCycle" ADD CONSTRAINT "VacationCycle_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
