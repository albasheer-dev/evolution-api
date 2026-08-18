-- Preserve each name source received from WhatsApp instead of flattening it into pushName.
ALTER TABLE "Contact"
ADD COLUMN "canonicalJid" VARCHAR(100),
ADD COLUMN "phoneNumberJid" VARCHAR(100),
ADD COLUMN "lidJid" VARCHAR(100),
ADD COLUMN "phonebookName" VARCHAR(255),
ADD COLUMN "whatsappPushName" VARCHAR(255),
ADD COLUMN "verifiedName" VARCHAR(255),
ADD COLUMN "username" VARCHAR(100),
ADD COLUMN "nameSource" VARCHAR(32),
ADD COLUMN "isMyContact" BOOLEAN,
ADD COLUMN "lastSyncedAt" TIMESTAMP;

ALTER TABLE "Contact" ALTER COLUMN "pushName" TYPE VARCHAR(255);

UPDATE "Contact"
SET
  "canonicalJid" = "remoteJid",
  "nameSource" = CASE WHEN NULLIF(BTRIM("pushName"), '') IS NULL THEN 'identifier' ELSE 'legacy' END,
  "lastSyncedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);

CREATE INDEX "Contact_instanceId_canonicalJid_idx" ON "Contact"("instanceId", "canonicalJid");
CREATE INDEX "Contact_instanceId_phoneNumberJid_idx" ON "Contact"("instanceId", "phoneNumberJid");
CREATE INDEX "Contact_instanceId_lidJid_idx" ON "Contact"("instanceId", "lidJid");
