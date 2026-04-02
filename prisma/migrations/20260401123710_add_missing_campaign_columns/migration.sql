-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "current_step" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "secondary_color" VARCHAR(7);
