/*
  Warnings:

  - You are about to drop the column `linkPrecendece` on the `Contact` table. All the data in the column will be lost.
  - Added the required column `linkPrecendence` to the `Contact` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "linkPrecendence" AS ENUM ('primary', 'secondary');

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "linkPrecendece",
ADD COLUMN     "linkPrecendence" "linkPrecendence" NOT NULL;

-- DropEnum
DROP TYPE "linkPrecendece";
