-- CreateTable
CREATE TABLE IF NOT EXISTS "VacationExclusion" (
    "id" TEXT NOT NULL,
    "employeeAId" TEXT NOT NULL,
    "employeeBId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VacationExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PositionOverlapLimit" (
    "id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "maxEmployees" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionOverlapLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "VacationExclusion_employeeAId_employeeBId_key" ON "VacationExclusion"("employeeAId", "employeeBId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PositionOverlapLimit_position_key" ON "PositionOverlapLimit"("position");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VacationExclusion_employeeAId_fkey') THEN
    ALTER TABLE "VacationExclusion" ADD CONSTRAINT "VacationExclusion_employeeAId_fkey"
    FOREIGN KEY ("employeeAId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'VacationExclusion_employeeBId_fkey') THEN
    ALTER TABLE "VacationExclusion" ADD CONSTRAINT "VacationExclusion_employeeBId_fkey"
    FOREIGN KEY ("employeeBId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
