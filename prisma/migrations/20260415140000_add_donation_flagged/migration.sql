ALTER TABLE "donations" ADD COLUMN "is_flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "donations" ADD COLUMN "flag_note" TEXT;
