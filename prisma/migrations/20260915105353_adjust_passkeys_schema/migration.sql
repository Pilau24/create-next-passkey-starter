/*
  Warnings:

  - You are about to drop the `Credential` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Credential";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "passkeys" (
    "cred_id" TEXT NOT NULL PRIMARY KEY,
    "cred_public_key" BLOB NOT NULL,
    "internal_user_id" INTEGER NOT NULL,
    "webauthn_user_id" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "backup_eligible" BOOLEAN NOT NULL DEFAULT false,
    "backup_status" BOOLEAN NOT NULL DEFAULT false,
    "transports" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used" DATETIME,
    CONSTRAINT "passkeys_internal_user_id_fkey" FOREIGN KEY ("internal_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "passkeys_internal_user_id_cred_id_idx" ON "passkeys"("internal_user_id", "cred_id");

-- CreateIndex
CREATE INDEX "passkeys_webauthn_user_id_cred_id_idx" ON "passkeys"("webauthn_user_id", "cred_id");

-- CreateIndex
CREATE UNIQUE INDEX "passkeys_internal_user_id_webauthn_user_id_key" ON "passkeys"("internal_user_id", "webauthn_user_id");
