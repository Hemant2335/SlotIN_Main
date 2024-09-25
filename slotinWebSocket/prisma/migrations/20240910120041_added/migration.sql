-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'PAUSED');

-- AlterTable
ALTER TABLE "SpaceItems" ADD COLUMN     "Status" "Status" NOT NULL DEFAULT 'PAUSED';
