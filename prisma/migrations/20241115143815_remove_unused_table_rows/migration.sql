
-- AlterEnum
BEGIN;
DELETE FROM "user_role" WHERE "role" = 'VIEWER';

CREATE TYPE "Role_new" AS ENUM ('USER', 'SUPERADMIN', 'ADDRESS_MANAGER');
ALTER TABLE "user_role" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "wallet_verification" DROP CONSTRAINT "wallet_verification_transaction_currency_unit_id_fkey";

-- AlterTable
ALTER TABLE "user_wallet" DROP COLUMN "is_default";

-- AlterTable
ALTER TABLE "wallet_verification" DROP COLUMN "transaction_amount",
DROP COLUMN "transaction_content",
DROP COLUMN "transaction_currency_unit_id",
DROP COLUMN "transaction_id";
