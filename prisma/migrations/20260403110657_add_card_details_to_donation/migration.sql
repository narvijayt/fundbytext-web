-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "card_brand" VARCHAR(50),
ADD COLUMN     "card_exp_month" INTEGER,
ADD COLUMN     "card_exp_year" INTEGER,
ADD COLUMN     "card_last4" VARCHAR(4);
