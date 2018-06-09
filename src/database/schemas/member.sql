CREATE TABLE IF NOT EXISTS "member" (
  "id" bigserial PRIMARY KEY,
  "email_address" varchar(255) UNIQUE,
  "email_address_verification_token" varchar(100),
  "email_address_verified" boolean,
  "password" varchar(100),
  "first_name" varchar(50),
  "last_name" varchar(50),
  "date_last_logged_in" Date NOT NULL DEFAULT NOW(),
  "date_created" Date NOT NULL DEFAULT NOW(),
  "date_updated" Date NOT NULL DEFAULT NOW()
);