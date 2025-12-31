-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Pacific Standard Time (PST)';

