-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'SUPERADMIN', 'ADDRESS_MANAGER', 'VIEWER');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "LedgerType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'REFUND');

-- CreateEnum
CREATE TYPE "CreditTicketStatus" AS ENUM ('REFUNDED', 'EXPIRED', 'REDEEMED', 'VALID', 'INVALID');

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
CREATE TABLE "receiver" (
    "id" SERIAL NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transaction" (
    "id" SERIAL NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "from" TEXT NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "amount" TEXT NOT NULL,
    "user_credit_id" INTEGER NOT NULL,
    "fail_reason" TEXT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "block_number" TEXT NOT NULL DEFAULT '0',
    "additional_ticket_days" INTEGER NOT NULL,

    CONSTRAINT "credit_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_transaction" (
    "id" SERIAL NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "amount" TEXT NOT NULL,
    "user_credit_id" INTEGER NOT NULL,
    "fail_reason" TEXT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "block_number" TEXT NOT NULL DEFAULT '0',

    CONSTRAINT "refund_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deploy_contract_transaction" (
    "id" SERIAL NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "block_number" TEXT NOT NULL DEFAULT '0',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "fail_reason" TEXT,

    CONSTRAINT "deploy_contract_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "deployed_from_address" TEXT NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdraw_transaction" (
    "id" SERIAL NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "amount" TEXT NOT NULL,
    "user_credit_id" INTEGER NOT NULL,
    "credit_ticket_id" INTEGER NOT NULL,
    "fail_reason" TEXT,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "block_number" TEXT NOT NULL DEFAULT '0',

    CONSTRAINT "withdraw_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credit" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "receiver_id" INTEGER NOT NULL,
    "amount" TEXT NOT NULL DEFAULT '0',
    "total_height" TEXT DEFAULT '0',
    "total_withdrawals" TEXT NOT NULL DEFAULT '0',
    "total_refunds" TEXT NOT NULL DEFAULT '0',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "refund_starts_at" TIMESTAMP(3),
    "withdraw_starts_at" TIMESTAMP(3),
    "withdraw_expires_at" TIMESTAMP(3),
    "contract_id" INTEGER NOT NULL,

    CONSTRAINT "user_credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_group" (
    "id" SERIAL NOT NULL,
    "user_credit_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3),
    "expired" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_ticket" (
    "id" SERIAL NOT NULL,
    "public_id" TEXT,
    "height" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ticket_group_id" INTEGER NOT NULL,
    "status" "CreditTicketStatus" NOT NULL DEFAULT 'VALID',
    "approximated_height" BIGINT NOT NULL,

    CONSTRAINT "credit_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger" (
    "id" SERIAL NOT NULL,
    "user_credit_id" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_emailHash_idx" ON "user"("emailHash");

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
CREATE UNIQUE INDEX "receiver_wallet_address_key" ON "receiver"("wallet_address");

-- CreateIndex
CREATE INDEX "receiver_wallet_address_idx" ON "receiver"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "credit_transaction_transaction_hash_key" ON "credit_transaction"("transaction_hash");

-- CreateIndex
CREATE INDEX "credit_transaction_transaction_hash_idx" ON "credit_transaction"("transaction_hash");

-- CreateIndex
CREATE INDEX "credit_transaction_status_idx" ON "credit_transaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "refund_transaction_transaction_hash_key" ON "refund_transaction"("transaction_hash");

-- CreateIndex
CREATE INDEX "refund_transaction_transaction_hash_idx" ON "refund_transaction"("transaction_hash");

-- CreateIndex
CREATE INDEX "refund_transaction_status_idx" ON "refund_transaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "deploy_contract_transaction_transaction_hash_key" ON "deploy_contract_transaction"("transaction_hash");

-- CreateIndex
CREATE INDEX "deploy_contract_transaction_user_id_idx" ON "deploy_contract_transaction"("user_id");

-- CreateIndex
CREATE INDEX "deploy_contract_transaction_transaction_hash_idx" ON "deploy_contract_transaction"("transaction_hash");

-- CreateIndex
CREATE UNIQUE INDEX "contract_address_key" ON "contract"("address");

-- CreateIndex
CREATE UNIQUE INDEX "contract_transaction_id_key" ON "contract"("transaction_id");

-- CreateIndex
CREATE INDEX "contract_user_id_idx" ON "contract"("user_id");

-- CreateIndex
CREATE INDEX "contract_deployed_from_address_idx" ON "contract"("deployed_from_address");

-- CreateIndex
CREATE UNIQUE INDEX "withdraw_transaction_transaction_hash_key" ON "withdraw_transaction"("transaction_hash");

-- CreateIndex
CREATE UNIQUE INDEX "withdraw_transaction_credit_ticket_id_key" ON "withdraw_transaction"("credit_ticket_id");

-- CreateIndex
CREATE INDEX "withdraw_transaction_transaction_hash_idx" ON "withdraw_transaction"("transaction_hash");

-- CreateIndex
CREATE INDEX "withdraw_transaction_status_idx" ON "withdraw_transaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_credit_contract_id_key" ON "user_credit"("contract_id");

-- CreateIndex
CREATE INDEX "user_credit_user_id_idx" ON "user_credit"("user_id");

-- CreateIndex
CREATE INDEX "ticket_group_user_credit_id_idx" ON "ticket_group"("user_credit_id");

-- CreateIndex
CREATE UNIQUE INDEX "credit_ticket_public_id_key" ON "credit_ticket"("public_id");

-- CreateIndex
CREATE INDEX "credit_ticket_ticket_group_id_idx" ON "credit_ticket"("ticket_group_id");

-- CreateIndex
CREATE INDEX "credit_ticket_public_id_idx" ON "credit_ticket"("public_id");

-- CreateIndex
CREATE INDEX "credit_ticket_status_idx" ON "credit_ticket"("status");

-- CreateIndex
CREATE INDEX "ledger_user_credit_id_idx" ON "ledger"("user_credit_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_ban_actioned_by_id_fkey" FOREIGN KEY ("ban_actioned_by_id") REFERENCES "user_role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_user_credit_id_fkey" FOREIGN KEY ("user_credit_id") REFERENCES "user_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_transaction" ADD CONSTRAINT "refund_transaction_user_credit_id_fkey" FOREIGN KEY ("user_credit_id") REFERENCES "user_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deploy_contract_transaction" ADD CONSTRAINT "deploy_contract_transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "deploy_contract_transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract" ADD CONSTRAINT "contract_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdraw_transaction" ADD CONSTRAINT "withdraw_transaction_user_credit_id_fkey" FOREIGN KEY ("user_credit_id") REFERENCES "user_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdraw_transaction" ADD CONSTRAINT "withdraw_transaction_credit_ticket_id_fkey" FOREIGN KEY ("credit_ticket_id") REFERENCES "credit_ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credit" ADD CONSTRAINT "user_credit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credit" ADD CONSTRAINT "user_credit_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "receiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_credit" ADD CONSTRAINT "user_credit_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_group" ADD CONSTRAINT "ticket_group_user_credit_id_fkey" FOREIGN KEY ("user_credit_id") REFERENCES "user_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ticket" ADD CONSTRAINT "credit_ticket_ticket_group_id_fkey" FOREIGN KEY ("ticket_group_id") REFERENCES "ticket_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_user_credit_id_fkey" FOREIGN KEY ("user_credit_id") REFERENCES "user_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
