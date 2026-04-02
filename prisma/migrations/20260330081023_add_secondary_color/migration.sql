-- AlterTable: add @unique to campaigns.name
CREATE UNIQUE INDEX IF NOT EXISTS "campaigns_name_key" ON "campaigns"("name");
