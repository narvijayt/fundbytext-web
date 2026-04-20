-- AlterEnum: add self_added value
ALTER TYPE "DonorSource" ADD VALUE 'self_added';

-- Back-fill: donors added by a participant (no organizer role on added_by_member) -> self_added
UPDATE "campaign_donors" cd
SET "source" = 'self_added'
WHERE cd."added_by_member_id" IS NOT NULL
  AND cd."source" = 'invited'
  AND NOT EXISTS (
    SELECT 1 FROM "campaign_member_roles" cmr
    WHERE cmr."member_id" = cd."added_by_member_id"
      AND cmr."role" = 'organizer'
  );
