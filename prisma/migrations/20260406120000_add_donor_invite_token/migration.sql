-- Add invite_token to campaign_donors for donor-specific invite links
ALTER TABLE "campaign_donors" ADD COLUMN "invite_token" VARCHAR(100);
CREATE UNIQUE INDEX "campaign_donors_invite_token_key" ON "campaign_donors"("invite_token");
