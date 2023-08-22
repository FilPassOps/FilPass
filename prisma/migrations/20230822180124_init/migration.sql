CREATE EXTENSION pgcrypto;

CREATE SEQUENCE transfer_request_public_id_1_seq START WITH 5000 INCREMENT BY 1;
CREATE SEQUENCE transfer_request_public_id_2_seq START WITH 100 INCREMENT BY 1;
CREATE SEQUENCE transfer_request_public_id_3_seq START WITH 5 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION getnextpublicidbigint() RETURNS TEXT
  LANGUAGE plpgsql
  AS $$
    BEGIN
      RETURN CONCAT(
        NEXTVAL('pl-disbursement."transfer_request_public_id_1_seq"'),
        NEXTVAL('pl-disbursement."transfer_request_public_id_2_seq"'),
        NEXTVAL('pl-disbursement."transfer_request_public_id_3_seq"')
        );
    END;
$$;


-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'APPROVER', 'CONTROLLER', 'SUPERADMIN', 'ADDRESS_MANAGER', 'COMPLIANCE', 'VIEWER', 'FINANCE');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TransferRequestReviewStatus" AS ENUM ('APPROVED', 'REJECTED', 'REQUIRES_CHANGES', 'BLOCKED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('ONE_TIME', 'LINEAR_VESTING');

-- CreateEnum
CREATE TYPE "TransferRequestStatus" AS ENUM ('SUBMITTED', 'VOIDED', 'APPROVED', 'PROCESSING', 'REJECTED_BY_APPROVER', 'REQUIRES_CHANGES', 'PAID', 'REJECTED_BY_CONTROLLER', 'SUBMITTED_BY_APPROVER', 'BLOCKED', 'REJECTED_BY_COMPLIANCE');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('W8_FORM', 'W9_FORM', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "ProgramCurrencyType" AS ENUM ('REQUEST', 'PAYMENT');

-- CreateEnum
CREATE TYPE "ProgramVisibility" AS ENUM ('EXTERNAL', 'INTERNAL');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationName" AS ENUM ('DOUBLE_SPENDING', 'TR_REQUIRES_CHANGE');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "emailHash" TEXT,
    "password" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" TEXT,
    "country_residence" TEXT,
    "is_sanctioned" BOOLEAN,
    "sanction_reason" TEXT,
    "is_us_resident" BOOLEAN,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "pii_updated_at" TIMESTAMP(3),
    "terms" JSONB,
    "is_onboarded" BOOLEAN NOT NULL DEFAULT false,
    "is_reviewed_compliance" BOOLEAN NOT NULL DEFAULT false,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "ban_reason" TEXT,
    "ban_actioned_by_id" INTEGER,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_program" (
    "id" SERIAL NOT NULL,
    "user_role_id" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_role_program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_program_group" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "user_role_program_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_program_group_members" (
    "id" SERIAL NOT NULL,
    "user_role_program_id" INTEGER NOT NULL,
    "user_role_program_group_id" INTEGER NOT NULL,

    CONSTRAINT "user_role_program_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_file" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT,
    "user_id" INTEGER NOT NULL,
    "uploader_id" INTEGER,
    "key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "type" "FileType" NOT NULL,
    "is_approved" BOOLEAN,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "rejection_reason" TEXT,

    CONSTRAINT "user_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_file" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT,
    "uploader_id" INTEGER,
    "key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "type" "FileType" NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "temporary_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallet" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "verification_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT NOT NULL,
    "blockchain_id" INTEGER NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_verification" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "blockchain_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "transaction_content" JSONB NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "transaction_amount" DECIMAL(65,8),
    "transaction_currency_unit_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "delivery_method" "DeliveryMethod" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "signers_wallet_addresses" TEXT[],
    "visibility" "ProgramVisibility" DEFAULT 'EXTERNAL',

    CONSTRAINT "program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_request" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "public_id" TEXT NOT NULL DEFAULT getnextpublicidbigint(),
    "requester_id" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "user_wallet_id" INTEGER NOT NULL,
    "user_file_id" INTEGER,
    "receiver_id" INTEGER NOT NULL,
    "team" TEXT NOT NULL,
    "team_hash" TEXT,
    "status" "TransferRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "amount" TEXT NOT NULL,
    "currency_unit_id" INTEGER NOT NULL,
    "terms" JSONB,
    "first_name" TEXT,
    "last_name" TEXT,
    "date_of_birth" TEXT,
    "country_residence" TEXT,
    "is_us_resident" BOOLEAN,
    "is_sanctioned" BOOLEAN,
    "is_legacy" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sanction_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expected_transfer_date" TIMESTAMP(3) NOT NULL,
    "actor_address" TEXT NOT NULL DEFAULT '',
    "robust_address" TEXT NOT NULL DEFAULT '',
    "attachment_id" INTEGER,
    "vesting_start_epoch" INTEGER,
    "vesting_months" INTEGER,

    CONSTRAINT "transfer_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_request_review" (
    "id" SERIAL NOT NULL,
    "approver_id" INTEGER NOT NULL,
    "transfer_request_id" INTEGER NOT NULL,
    "status" "TransferRequestReviewStatus" NOT NULL,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_request_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_request_draft" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL DEFAULT getnextpublicidbigint(),
    "requester_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "attachment_id" INTEGER,
    "program_id" INTEGER NOT NULL,
    "currency_unit_id" INTEGER NOT NULL,
    "team" TEXT NOT NULL,
    "team_hash" TEXT,
    "amount" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_submitted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transfer_request_draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_request_history" (
    "id" SERIAL NOT NULL,
    "user_role_id" INTEGER NOT NULL,
    "transfer_request_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "field" TEXT NOT NULL,
    "old_value" TEXT NOT NULL,
    "new_value" TEXT NOT NULL,

    CONSTRAINT "transfer_request_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer_request_approvals" (
    "id" SERIAL NOT NULL,
    "transfer_request_id" INTEGER NOT NULL,
    "user_role_id" INTEGER NOT NULL,
    "user_role_program_group_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfer_request_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfer" (
    "id" SERIAL NOT NULL,
    "transfer_request_id" INTEGER NOT NULL,
    "user_role_id" INTEGER NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "tx_hash" TEXT,
    "transfer_ref" TEXT,
    "from" TEXT,
    "to" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "amount" TEXT,
    "amount_currency_unit_id" INTEGER,

    CONSTRAINT "transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(65,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currency_unit" (
    "id" SERIAL NOT NULL,
    "currency_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "scale" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currency_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_currency" (
    "id" SERIAL NOT NULL,
    "currency_unit_id" INTEGER NOT NULL,
    "program_id" INTEGER NOT NULL,
    "type" "ProgramCurrencyType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "script_transaction" (
    "id" SERIAL NOT NULL,
    "transaction" TEXT NOT NULL,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "script_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_verification" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "origin" JSONB,
    "tries_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_valid" BOOLEAN NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" SERIAL NOT NULL,
    "name" "NotificationName" NOT NULL,
    "last_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_tracker" (
    "id" SERIAL NOT NULL,
    "block_number" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "block_tracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscriber" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blockchain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_emailHash_idx" ON "user"("emailHash");

-- CreateIndex
CREATE INDEX "user_role_program_user_role_id_is_active_idx" ON "user_role_program"("user_role_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_file_public_id_key" ON "user_file"("public_id");

-- CreateIndex
CREATE INDEX "user_file_public_id_idx" ON "user_file"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_file_id_key_key" ON "user_file"("id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_file_public_id_key" ON "temporary_file"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_file_key_key" ON "temporary_file"("key");

-- CreateIndex
CREATE INDEX "temporary_file_public_id_idx" ON "temporary_file"("public_id");

-- CreateIndex
CREATE INDEX "user_wallet_address_idx" ON "user_wallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallet_user_id_address_key" ON "user_wallet"("user_id", "address");

-- CreateIndex
CREATE UNIQUE INDEX "program_name_key" ON "program"("name");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_request_uuid_key" ON "transfer_request"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_request_public_id_key" ON "transfer_request"("public_id");

-- CreateIndex
CREATE INDEX "transfer_request_created_at_idx" ON "transfer_request"("created_at");

-- CreateIndex
CREATE INDEX "transfer_request_updated_at_idx" ON "transfer_request"("updated_at");

-- CreateIndex
CREATE INDEX "transfer_request_program_id_idx" ON "transfer_request"("program_id");

-- CreateIndex
CREATE INDEX "transfer_request_team_hash_idx" ON "transfer_request"("team_hash");

-- CreateIndex
CREATE INDEX "transfer_request_public_id_idx" ON "transfer_request"("public_id");

-- CreateIndex
CREATE INDEX "transfer_request_status_idx" ON "transfer_request"("status");

-- CreateIndex
CREATE INDEX "transfer_request_is_active_idx" ON "transfer_request"("is_active");

-- CreateIndex
CREATE INDEX "transfer_request_public_id_status_is_active_idx" ON "transfer_request"("public_id", "status", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "transfer_request_draft_public_id_key" ON "transfer_request_draft"("public_id");

-- CreateIndex
CREATE INDEX "transfer_request_draft_created_at_idx" ON "transfer_request_draft"("created_at");

-- CreateIndex
CREATE INDEX "transfer_request_draft_program_id_idx" ON "transfer_request_draft"("program_id");

-- CreateIndex
CREATE INDEX "transfer_request_draft_public_id_idx" ON "transfer_request_draft"("public_id");

-- CreateIndex
CREATE INDEX "transfer_request_draft_team_hash_idx" ON "transfer_request_draft"("team_hash");

-- CreateIndex
CREATE INDEX "transfer_transfer_ref_idx" ON "transfer"("transfer_ref");

-- CreateIndex
CREATE UNIQUE INDEX "currency_name_key" ON "currency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "currency_unit_currency_id_name_key" ON "currency_unit"("currency_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "script_transaction_transaction_key" ON "script_transaction"("transaction");

-- CreateIndex
CREATE INDEX "auth_verification_user_id_code_idx" ON "auth_verification"("user_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_user_id_code_key" ON "auth_verification"("user_id", "code");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_user_id_id_key" ON "session"("user_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_name_key" ON "notification_settings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriber_email_key" ON "newsletter_subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriber_email_hash_key" ON "newsletter_subscriber"("email_hash");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_name_key" ON "blockchain"("name");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_ban_actioned_by_id_fkey" FOREIGN KEY ("ban_actioned_by_id") REFERENCES "user_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_program" ADD CONSTRAINT "user_role_program_user_role_id_fkey" FOREIGN KEY ("user_role_id") REFERENCES "user_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_program" ADD CONSTRAINT "user_role_program_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_program_group" ADD CONSTRAINT "user_role_program_group_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_program_group_members" ADD CONSTRAINT "user_role_program_group_members_user_role_program_id_fkey" FOREIGN KEY ("user_role_program_id") REFERENCES "user_role_program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_program_group_members" ADD CONSTRAINT "user_role_program_group_members_user_role_program_group_id_fkey" FOREIGN KEY ("user_role_program_group_id") REFERENCES "user_role_program_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_file" ADD CONSTRAINT "user_file_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_file" ADD CONSTRAINT "user_file_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_file" ADD CONSTRAINT "temporary_file_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_wallet" ADD CONSTRAINT "user_wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_wallet" ADD CONSTRAINT "user_wallet_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "wallet_verification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_wallet" ADD CONSTRAINT "user_wallet_blockchain_id_fkey" FOREIGN KEY ("blockchain_id") REFERENCES "blockchain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_verification" ADD CONSTRAINT "wallet_verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_verification" ADD CONSTRAINT "wallet_verification_blockchain_id_fkey" FOREIGN KEY ("blockchain_id") REFERENCES "blockchain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_verification" ADD CONSTRAINT "wallet_verification_transaction_currency_unit_id_fkey" FOREIGN KEY ("transaction_currency_unit_id") REFERENCES "currency_unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request" ADD CONSTRAINT "transfer_request_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request" ADD CONSTRAINT "transfer_request_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request" ADD CONSTRAINT "transfer_request_user_wallet_id_fkey" FOREIGN KEY ("user_wallet_id") REFERENCES "user_wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request" ADD CONSTRAINT "transfer_request_user_file_id_fkey" FOREIGN KEY ("user_file_id") REFERENCES "user_file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request" ADD CONSTRAINT "transfer_request_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request" ADD CONSTRAINT "transfer_request_currency_unit_id_fkey" FOREIGN KEY ("currency_unit_id") REFERENCES "currency_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request" ADD CONSTRAINT "transfer_request_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "user_file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_review" ADD CONSTRAINT "transfer_request_review_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "user_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_review" ADD CONSTRAINT "transfer_request_review_transfer_request_id_fkey" FOREIGN KEY ("transfer_request_id") REFERENCES "transfer_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_draft" ADD CONSTRAINT "transfer_request_draft_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_draft" ADD CONSTRAINT "transfer_request_draft_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_draft" ADD CONSTRAINT "transfer_request_draft_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "user_file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_draft" ADD CONSTRAINT "transfer_request_draft_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_draft" ADD CONSTRAINT "transfer_request_draft_currency_unit_id_fkey" FOREIGN KEY ("currency_unit_id") REFERENCES "currency_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_history" ADD CONSTRAINT "transfer_request_history_user_role_id_fkey" FOREIGN KEY ("user_role_id") REFERENCES "user_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_history" ADD CONSTRAINT "transfer_request_history_transfer_request_id_fkey" FOREIGN KEY ("transfer_request_id") REFERENCES "transfer_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_approvals" ADD CONSTRAINT "transfer_request_approvals_transfer_request_id_fkey" FOREIGN KEY ("transfer_request_id") REFERENCES "transfer_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_approvals" ADD CONSTRAINT "transfer_request_approvals_user_role_id_fkey" FOREIGN KEY ("user_role_id") REFERENCES "user_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_request_approvals" ADD CONSTRAINT "transfer_request_approvals_user_role_program_group_id_fkey" FOREIGN KEY ("user_role_program_group_id") REFERENCES "user_role_program_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_transfer_request_id_fkey" FOREIGN KEY ("transfer_request_id") REFERENCES "transfer_request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_user_role_id_fkey" FOREIGN KEY ("user_role_id") REFERENCES "user_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer" ADD CONSTRAINT "transfer_amount_currency_unit_id_fkey" FOREIGN KEY ("amount_currency_unit_id") REFERENCES "currency_unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_unit" ADD CONSTRAINT "currency_unit_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_currency" ADD CONSTRAINT "program_currency_currency_unit_id_fkey" FOREIGN KEY ("currency_unit_id") REFERENCES "currency_unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_currency" ADD CONSTRAINT "program_currency_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_verification" ADD CONSTRAINT "auth_verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
