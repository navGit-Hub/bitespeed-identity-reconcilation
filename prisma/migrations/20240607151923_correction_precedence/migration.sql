/*
  Warnings:

  - You are about to drop the column `linkPrecendence` on the `Contact` table. All the data in the column will be lost.
  - Added the required column `linkPrecedence` to the `Contact` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "linkPrecedence" AS ENUM ('primary', 'secondary');

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "linkPrecendence",
ADD COLUMN     "linkPrecedence" "linkPrecedence" NOT NULL;

-- DropEnum
DROP TYPE "linkPrecendence";
