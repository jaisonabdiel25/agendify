-- AlterTable: agregar columnas como nullable primero
ALTER TABLE "Plan"
  ADD COLUMN "maxServices"      INTEGER,
  ADD COLUMN "maxChairs"        INTEGER,
  ADD COLUMN "maxUsers"         INTEGER,
  ADD COLUMN "canInvite"        BOOLEAN,
  ADD COLUMN "statisticsCharts" TEXT[];

-- Rellenar planes existentes con sus valores
UPDATE "Plan"
SET
  "maxServices"      = 1,
  "maxChairs"        = 1,
  "maxUsers"         = 1,
  "canInvite"        = false,
  "statisticsCharts" = ARRAY['status']
WHERE "id" = 'plan_standard_v1';

UPDATE "Plan"
SET
  "maxServices"      = 2,
  "maxChairs"        = 3,
  "maxUsers"         = 3,
  "canInvite"        = true,
  "statisticsCharts" = ARRAY['*']
WHERE "id" = 'plan_pro_v1';

-- Hacer las columnas NOT NULL ahora que tienen datos
ALTER TABLE "Plan"
  ALTER COLUMN "maxServices"      SET NOT NULL,
  ALTER COLUMN "maxChairs"        SET NOT NULL,
  ALTER COLUMN "maxUsers"         SET NOT NULL,
  ALTER COLUMN "canInvite"        SET NOT NULL,
  ALTER COLUMN "statisticsCharts" SET NOT NULL;
