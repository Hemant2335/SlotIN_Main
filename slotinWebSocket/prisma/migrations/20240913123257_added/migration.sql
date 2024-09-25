/*
  Warnings:

  - Added the required column `phone` to the `OfflineAppointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OfflineAppointments" ADD COLUMN     "phone" TEXT NOT NULL;
