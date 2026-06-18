-- Add tertiary brand color to campaigns (nullable, additive — non-destructive)
ALTER TABLE "campaigns" ADD COLUMN "tertiary_color" VARCHAR(7);
