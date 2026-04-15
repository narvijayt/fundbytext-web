-- AlterTable
ALTER TABLE "campaign_donors" ADD COLUMN     "added_by_member_id" UUID;

-- AddForeignKey
ALTER TABLE "campaign_donors" ADD CONSTRAINT "campaign_donors_added_by_member_id_fkey" FOREIGN KEY ("added_by_member_id") REFERENCES "campaign_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
