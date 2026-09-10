-- AlterTable
ALTER TABLE "User" ADD COLUMN     "seenTutorials" TEXT[] DEFAULT ARRAY[]::TEXT[];
