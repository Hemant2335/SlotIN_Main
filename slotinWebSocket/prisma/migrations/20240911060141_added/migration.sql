/*
  Warnings:

  - You are about to drop the column `time` on the `Appointments` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `OfflineAppointments` table. All the data in the column will be lost.
  - Added the required column `fromtime` to the `Appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totime` to the `Appointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromtime` to the `OfflineAppointments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totime` to the `OfflineAppointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointments" DROP COLUMN "time",
ADD COLUMN     "fromtime" TEXT NOT NULL,
ADD COLUMN     "totime" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "OfflineAppointments" DROP COLUMN "time",
ADD COLUMN     "fromtime" TEXT NOT NULL,
ADD COLUMN     "totime" TEXT NOT NULL;
