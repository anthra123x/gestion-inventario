-- Create BudgetPeriodStatus enum
DO $$ BEGIN
  CREATE TYPE "BudgetPeriodStatus" AS ENUM ('ACTIVE', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create budget_periods table
CREATE TABLE IF NOT EXISTS "budget_periods" (
  "id" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "status" "BudgetPeriodStatus" NOT NULL DEFAULT 'ACTIVE',
  "initialBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "savingsAllocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "budget_periods_pkey" PRIMARY KEY ("id")
);

-- Add periodId column to transactions table
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "periodId" TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS "budget_periods_status_idx" ON "budget_periods"("status");
CREATE INDEX IF NOT EXISTS "budget_periods_dates_idx" ON "budget_periods"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "transactions_period_id_idx" ON "transactions"("periodId");