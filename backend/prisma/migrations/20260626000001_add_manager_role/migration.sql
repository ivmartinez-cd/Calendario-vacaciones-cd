-- Add MANAGER value to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MANAGER';

-- Add managedDepartmentId column to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "managedDepartmentId" TEXT;

-- Add foreign key constraint (safe check)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'User_managedDepartmentId_fkey'
  ) THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_managedDepartmentId_fkey"
    FOREIGN KEY ("managedDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
