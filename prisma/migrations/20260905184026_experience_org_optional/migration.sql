-- DropForeignKey
ALTER TABLE "Experience" DROP CONSTRAINT "Experience_orgId_fkey";

-- AlterTable
ALTER TABLE "Experience" ALTER COLUMN "orgId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;
