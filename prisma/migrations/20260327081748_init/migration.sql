-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('individual', 'organization');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'upcoming', 'active', 'completed');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('open_ended', 'fixed', 'org_goal', 'participant_goal');

-- CreateEnum
CREATE TYPE "BackgroundTheme" AS ENUM ('logo', 'athletic', 'sports', 'trophy_wall', 'geometric', 'abstract');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('profile', 'hero', 'gallery');

-- CreateEnum
CREATE TYPE "DonorStatus" AS ENUM ('not_donated', 'contacted', 'donated');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'paypal', 'google_pay', 'amex');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('participant', 'campaign');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('scheduled', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('sms', 'email', 'both');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('organizer', 'participant');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" TEXT NOT NULL,
    "profile_photo_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "password_reset_token" VARCHAR(255),
    "password_reset_expires" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_mobile" BOOLEAN NOT NULL DEFAULT false,
    "remember_me" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMPTZ(3),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "logo_url" TEXT,
    "invite_token" VARCHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "organization_id" UUID,
    "campaign_type" "CampaignType" NOT NULL,
    "name" VARCHAR(50),
    "slug" VARCHAR(100) NOT NULL,
    "org_display_name" VARCHAR(100),
    "story" TEXT,
    "start_date" TIMESTAMPTZ(3),
    "end_date" TIMESTAMPTZ(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'draft',
    "goal_type" "GoalType",
    "goal_amount" DECIMAL(10,2),
    "total_raised" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "donors_per_participant" INTEGER,
    "target_contacts" INTEGER,
    "background_theme" "BackgroundTheme" NOT NULL DEFAULT 'sports',
    "accent_color" VARCHAR(7),
    "thank_you_message" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_media" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_payout" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "recipient_first_name" VARCHAR(100) NOT NULL,
    "recipient_last_name" VARCHAR(100) NOT NULL,
    "org_name" VARCHAR(100),
    "street_address" VARCHAR(255) NOT NULL,
    "apt_suite" VARCHAR(50),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "zip" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "campaign_payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_members" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "user_id" UUID,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "profile_photo_url" TEXT,
    "can_upload_photo" BOOLEAN NOT NULL DEFAULT false,
    "target_donors" INTEGER NOT NULL DEFAULT 20,
    "invite_token" VARCHAR(100),
    "joined_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "campaign_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_member_roles" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "role" "MemberRole" NOT NULL,

    CONSTRAINT "campaign_member_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_donors" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "assigned_member_id" UUID,
    "user_id" UUID,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "email_valid" BOOLEAN NOT NULL DEFAULT true,
    "status" "DonorStatus" NOT NULL DEFAULT 'not_donated',
    "last_contacted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "campaign_donors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "campaign_donor_id" UUID,
    "member_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "platform_fee" DECIMAL(10,2) NOT NULL,
    "net_amount" DECIMAL(10,2) NOT NULL,
    "donor_first_name" VARCHAR(100) NOT NULL,
    "donor_last_name" VARCHAR(100) NOT NULL,
    "donor_display_name" VARCHAR(255),
    "donor_email" VARCHAR(255),
    "donor_phone" VARCHAR(20),
    "donor_country" VARCHAR(100),
    "donor_zip" VARCHAR(10),
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "stripe_payment_intent_id" VARCHAR(255),
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'card',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_notifications" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "recipient_member_id" UUID,
    "notification_type" "NotificationType" NOT NULL,
    "trigger_event" VARCHAR(100) NOT NULL,
    "message" TEXT NOT NULL,
    "helper_text" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'both',
    "scheduled_at" TIMESTAMPTZ(3),
    "sent_at" TIMESTAMPTZ(3),
    "status" "NotificationStatus" NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_password_reset_token_key" ON "users"("password_reset_token");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_created_by_key" ON "organizations"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_invite_token_key" ON "organizations"("invite_token");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_payout_campaign_id_key" ON "campaign_payout"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_members_invite_token_key" ON "campaign_members"("invite_token");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_members_campaign_id_email_key" ON "campaign_members"("campaign_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_member_roles_member_id_role_key" ON "campaign_member_roles"("member_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "donations_stripe_payment_intent_id_key" ON "donations"("stripe_payment_intent_id");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_media" ADD CONSTRAINT "campaign_media_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_payout" ADD CONSTRAINT "campaign_payout_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_member_roles" ADD CONSTRAINT "campaign_member_roles_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "campaign_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_donors" ADD CONSTRAINT "campaign_donors_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_donors" ADD CONSTRAINT "campaign_donors_assigned_member_id_fkey" FOREIGN KEY ("assigned_member_id") REFERENCES "campaign_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_donors" ADD CONSTRAINT "campaign_donors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_donor_id_fkey" FOREIGN KEY ("campaign_donor_id") REFERENCES "campaign_donors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "campaign_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_notifications" ADD CONSTRAINT "campaign_notifications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_notifications" ADD CONSTRAINT "campaign_notifications_recipient_member_id_fkey" FOREIGN KEY ("recipient_member_id") REFERENCES "campaign_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
