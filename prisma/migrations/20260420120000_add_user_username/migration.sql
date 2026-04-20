-- Add username field to users table
ALTER TABLE "users" ADD COLUMN "username" VARCHAR(30);
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
