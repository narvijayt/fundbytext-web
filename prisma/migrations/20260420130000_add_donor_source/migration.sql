-- CreateEnum
CREATE TYPE "DonorSource" AS ENUM ('invited', 'walk_in', 'link_self');

-- AlterTable
ALTER TABLE "campaign_donors" ADD COLUMN "source" "DonorSource" NOT NULL DEFAULT 'invited';

-- Back-fill: donors with no added_by_member_id are organic walk-ins
UPDATE "campaign_donors" SET "source" = 'walk_in' WHERE "added_by_member_id" IS NULL;
