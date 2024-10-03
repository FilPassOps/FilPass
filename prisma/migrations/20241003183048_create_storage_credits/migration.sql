-- CreateEnum
CREATE TYPE "CreditTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

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
    "split_group" TEXT,

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
CREATE TABLE "storage_provider_withdrawal" (
    "id" SERIAL NOT NULL,
    "storage_provider_id" INTEGER NOT NULL,
    "credit_token_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_provider_withdrawal_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "redeem_request_credit_token_id_idx" ON "redeem_request"("credit_token_id");

-- CreateIndex
CREATE INDEX "storage_provider_withdrawal_credit_token_id_idx" ON "storage_provider_withdrawal"("credit_token_id");

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
ALTER TABLE "storage_provider_withdrawal" ADD CONSTRAINT "storage_provider_withdrawal_storage_provider_id_fkey" FOREIGN KEY ("storage_provider_id") REFERENCES "storage_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_provider_withdrawal" ADD CONSTRAINT "storage_provider_withdrawal_credit_token_id_fkey" FOREIGN KEY ("credit_token_id") REFERENCES "credit_token"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
