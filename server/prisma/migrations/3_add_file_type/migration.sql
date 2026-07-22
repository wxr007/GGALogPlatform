-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('RawRover', 'RawBase', 'LogRover', 'LogBase');

-- AlterTable
ALTER TABLE "datasets" ADD COLUMN "fileType" "FileType" NOT NULL DEFAULT 'RawRover';
