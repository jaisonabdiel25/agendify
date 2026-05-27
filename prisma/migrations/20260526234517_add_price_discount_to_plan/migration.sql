-- AlterTable: cast type column from PlanType enum to TEXT preserving data
ALTER TABLE "Plan" ALTER COLUMN "type" TYPE TEXT USING "type"::TEXT;

-- AlterTable: add new columns
ALTER TABLE "Plan" ADD COLUMN "discount" DOUBLE PRECISION,
ADD COLUMN "price" DECIMAL(10,2);

-- DropEnum
DROP TYPE "PlanType";
