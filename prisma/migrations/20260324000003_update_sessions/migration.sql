-- AlterTable
ALTER TABLE "user_sessions" DROP COLUMN "refresh_token",
ADD COLUMN     "is_mobile" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "expires_at" DROP NOT NULL;
