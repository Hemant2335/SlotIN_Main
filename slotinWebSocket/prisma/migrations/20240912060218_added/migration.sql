-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('ACTIVE', 'MISSED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Appointments" ADD COLUMN     "status" "AppointmentStatus" NOT NULL DEFAULT 'ACTIVE';
