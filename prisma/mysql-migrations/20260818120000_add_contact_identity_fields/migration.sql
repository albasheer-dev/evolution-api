-- Preserve each name source received from WhatsApp instead of flattening it into pushName.
ALTER TABLE `Contact`
ADD COLUMN `canonicalJid` VARCHAR(100) NULL,
ADD COLUMN `phoneNumberJid` VARCHAR(100) NULL,
ADD COLUMN `lidJid` VARCHAR(100) NULL,
ADD COLUMN `phonebookName` VARCHAR(255) NULL,
ADD COLUMN `whatsappPushName` VARCHAR(255) NULL,
ADD COLUMN `verifiedName` VARCHAR(255) NULL,
ADD COLUMN `username` VARCHAR(100) NULL,
ADD COLUMN `nameSource` VARCHAR(32) NULL,
ADD COLUMN `isMyContact` BOOLEAN NULL,
ADD COLUMN `lastSyncedAt` TIMESTAMP NULL,
MODIFY `pushName` VARCHAR(255) NULL;

UPDATE `Contact`
SET
  `canonicalJid` = `remoteJid`,
  `nameSource` = CASE WHEN NULLIF(TRIM(`pushName`), '') IS NULL THEN 'identifier' ELSE 'legacy' END,
  `lastSyncedAt` = COALESCE(`updatedAt`, `createdAt`, CURRENT_TIMESTAMP);

CREATE INDEX `Contact_instanceId_canonicalJid_idx` ON `Contact`(`instanceId`, `canonicalJid`);
CREATE INDEX `Contact_instanceId_phoneNumberJid_idx` ON `Contact`(`instanceId`, `phoneNumberJid`);
CREATE INDEX `Contact_instanceId_lidJid_idx` ON `Contact`(`instanceId`, `lidJid`);
