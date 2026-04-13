-- CreateEnum
CREATE TYPE "CampaignVisibility" AS ENUM ('private', 'unlisted', 'public');

-- AlterTable: replace is_published with visibility + donations_enabled
ALTER TABLE "campaigns"
    DROP COLUMN "is_published",
    ADD COLUMN "visibility" "CampaignVisibility" NOT NULL DEFAULT 'private',
    ADD COLUMN "donations_enabled" BOOLEAN NOT NULL DEFAULT true;
