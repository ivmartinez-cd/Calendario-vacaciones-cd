-- CreateEnum
CREATE TYPE "AbsenceType" AS ENUM ('DESCUENTO_DIA', 'BAJA_ENFERMEDAD', 'TRAMITE_PERSONAL', 'GUARDIA', 'DIA_ESTUDIO', 'OTHER');

-- CreateTable
CREATE TABLE "Absence" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysCount" INTEGER NOT NULL,
    "type" "AbsenceType" NOT NULL,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Absence_employeeId_idx" ON "Absence"("employeeId");

-- CreateIndex
CREATE INDEX "Absence_type_idx" ON "Absence"("type");

-- CreateIndex
CREATE INDEX "Absence_startDate_endDate_idx" ON "Absence"("startDate", "endDate");

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
