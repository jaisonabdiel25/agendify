-- AlterTable: agregar isActive como nullable primero
ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN;

-- Activar todos los usuarios existentes
UPDATE "User" SET "isActive" = true;

-- Hacer la columna NOT NULL con default false para nuevos usuarios
ALTER TABLE "User" ALTER COLUMN "isActive" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "isActive" SET DEFAULT false;
