-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'SUPERADMIN', 'ADDRESS_MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('ATTACHMENT');

-- CreateEnum
CREATE TYPE "CreditTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "emailHash" TEXT,
    "password" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "terms" BOOLEAN,
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
CREATE TABLE "user_file" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT,
    "user_id" INTEGER NOT NULL,
    "uploader_id" INTEGER,
    "key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "type" "FileType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

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
CREATE TABLE "currency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(65,2) NOT NULL,
    "blockchain_id" INTEGER,
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
CREATE TABLE "block_tracker" (
    "id" SERIAL NOT NULL,
    "block_number" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "block_tracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blockchain" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "chain_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blockchain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_provider" (
    "id" SERIAL NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transaction" (
    "id" SERIAL NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "status" "CreditTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "from" TEXT NOT NULL,
    "storage_provider_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "amount" TEXT NOT NULL,
    "user_credit_id" INTEGER NOT NULL,

    CONSTRAINT "credit_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credit" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "storage_provider_id" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,
    "total_height" TEXT DEFAULT '0',
    "total_withdrawals" TEXT NOT NULL DEFAULT '0',
    "total_refunds" TEXT NOT NULL DEFAULT '0',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "refund_starts_at" TIMESTAMP(3),
    "withdraw_starts_at" TIMESTAMP(3),
    "withdraw_expires_at" TIMESTAMP(3),
    "current_token_id" INTEGER,

    CONSTRAINT "user_credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_token" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "user_credit_id" INTEGER NOT NULL,
    "height" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "redeemable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "split_group" TEXT DEFAULT '1',

    CONSTRAINT "credit_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redeem_request" (
    "id" SERIAL NOT NULL,
    "storage_provider_id" INTEGER NOT NULL,
    "credit_token_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "redeem_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_request" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" TEXT NOT NULL,
    "user_credit_id" INTEGER NOT NULL,

    CONSTRAINT "refund_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_emailHash_idx" ON "user"("emailHash");

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
CREATE UNIQUE INDEX "user_wallet_user_id_address_blockchain_id_key" ON "user_wallet"("user_id", "address", "blockchain_id");

-- CreateIndex
CREATE UNIQUE INDEX "currency_name_key" ON "currency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "currency_unit_currency_id_name_key" ON "currency_unit"("currency_id", "name");

-- CreateIndex
CREATE INDEX "auth_verification_user_id_code_idx" ON "auth_verification"("user_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_user_id_code_key" ON "auth_verification"("user_id", "code");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_user_id_id_key" ON "session"("user_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_name_key" ON "blockchain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_chain_id_key" ON "blockchain"("chain_id");

-- CreateIndex
CREATE UNIQUE INDEX "storage_provider_wallet_address_key" ON "storage_provider"("wallet_address");

-- CreateIndex
CREATE INDEX "storage_provider_wallet_address_idx" ON "storage_provider"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "credit_transaction_transaction_hash_key" ON "credit_transaction"("transaction_hash");

-- CreateIndex
CREATE INDEX "credit_transaction_transaction_hash_idx" ON "credit_transaction"("transaction_hash");

-- CreateIndex
CREATE UNIQUE INDEX "user_credit_current_token_id_key" ON "user_credit"("current_token_id");

-- CreateIndex
CREATE INDEX "user_credit_user_id_idx" ON "user_credit"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_token_public_id_key" ON "credit_token"("public_id");

-- CreateIndex
CREATE INDEX "credit_token_user_credit_id_idx" ON "credit_token"("user_credit_id");

-- CreateIndex
CREATE INDEX "credit_token_split_group_idx" ON "credit_token"("split_group");

-- CreateIndex
CREATE INDEX "redeem_request_credit_token_id_idx" ON "redeem_request"("credit_token_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_ban_actioned_by_id_fkey" FOREIGN KEY ("ban_actioned_by_id") REFERENCES "user_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "currency" ADD CONSTRAINT "currency_blockchain_id_fkey" FOREIGN KEY ("blockchain_id") REFERENCES "blockchain"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "currency_unit" ADD CONSTRAINT "currency_unit_currency_id_fkey" FOREIGN KEY ("currency_id") REFERENCES "currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_verification" ADD CONSTRAINT "auth_verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_storage_provider_id_fkey" FOREIGN KEY ("storage_provider_id") REFERENCES "storage_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_user_credit_id_fkey" FOREIGN KEY ("user_credit_id") REFERENCES "user_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credit" ADD CONSTRAINT "user_credit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credit" ADD CONSTRAINT "user_credit_storage_provider_id_fkey" FOREIGN KEY ("storage_provider_id") REFERENCES "storage_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credit" ADD CONSTRAINT "user_credit_current_token_id_fkey" FOREIGN KEY ("current_token_id") REFERENCES "credit_token"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_token" ADD CONSTRAINT "credit_token_user_credit_id_fkey" FOREIGN KEY ("user_credit_id") REFERENCES "user_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redeem_request" ADD CONSTRAINT "redeem_request_storage_provider_id_fkey" FOREIGN KEY ("storage_provider_id") REFERENCES "storage_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "redeem_request" ADD CONSTRAINT "redeem_request_credit_token_id_fkey" FOREIGN KEY ("credit_token_id") REFERENCES "credit_token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_request" ADD CONSTRAINT "refund_request_user_credit_id_fkey" FOREIGN KEY ("user_credit_id") REFERENCES "user_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
