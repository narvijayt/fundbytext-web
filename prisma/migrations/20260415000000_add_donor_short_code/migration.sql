ALTER TABLE "campaign_donors" ADD COLUMN "short_code" VARCHAR(8);
CREATE UNIQUE INDEX "campaign_donors_short_code_key" ON "campaign_donors"("short_code");
