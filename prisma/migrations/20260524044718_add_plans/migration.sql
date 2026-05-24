-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('STANDARD', 'PRO');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "type" "PlanType" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_type_key" ON "Plan"("type");

-- Seed initial plans
INSERT INTO "Plan" ("id", "type", "name") VALUES
    ('plan_standard_v1', 'STANDARD', 'Estándar'),
    ('plan_pro_v1', 'PRO', 'Pro');

-- AlterTable: add nullable first
ALTER TABLE "Business" ADD COLUMN "planId" TEXT;

-- Assign all existing businesses to PRO plan
UPDATE "Business" SET "planId" = 'plan_pro_v1';

-- Make column required
ALTER TABLE "Business" ALTER COLUMN "planId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
