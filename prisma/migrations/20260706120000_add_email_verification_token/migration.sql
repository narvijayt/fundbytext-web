-- Email verification token + expiry on users (mirrors the password-reset pattern).
-- Used by the "Verify Email" flow launched from the Edit Profile modal.
ALTER TABLE "users" ADD COLUMN "email_verification_token" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN "email_verification_expires" TIMESTAMPTZ(3);
CREATE UNIQUE INDEX "users_email_verification_token_key" ON "users"("email_verification_token");
