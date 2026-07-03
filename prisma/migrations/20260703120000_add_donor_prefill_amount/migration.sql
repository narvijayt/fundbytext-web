-- Add an optional organizer/participant-set suggested donation amount (in cents)
-- to campaign donors. Prefilled in the donate form via the donor invite link.
ALTER TABLE "campaign_donors" ADD COLUMN "prefill_amount_cents" INTEGER;
