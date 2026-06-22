-- AlterTable
ALTER TABLE "VacationRequest" ADD COLUMN "chargedToYear" INTEGER;

-- Backfill: existing requests charge to the year of their startDate
UPDATE "VacationRequest" SET "chargedToYear" = EXTRACT(YEAR FROM "startDate")::INTEGER WHERE "chargedToYear" IS NULL;

-- CreateIndex
CREATE INDEX "VacationRequest_chargedToYear_idx" ON "VacationRequest"("chargedToYear");
