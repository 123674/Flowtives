/*
  Warnings:

  - You are about to drop the column `today` on the `EventsDB` table. All the data in the column will be lost.
  - Changed the type of `startTime` on the `EventsDB` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `EventsDB` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "EventsDB" DROP COLUMN "today",
DROP COLUMN "startTime",
ADD COLUMN     "startTime" TIMESTAMPTZ(3) NOT NULL,
DROP COLUMN "endTime",
ADD COLUMN     "endTime" TIMESTAMPTZ(3) NOT NULL;
