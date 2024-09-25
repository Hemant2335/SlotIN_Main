-- CreateTable
CREATE TABLE "OfflineAppointments" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "spaceId" TEXT NOT NULL,

    CONSTRAINT "OfflineAppointments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OfflineAppointments" ADD CONSTRAINT "OfflineAppointments_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "SpaceItems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
