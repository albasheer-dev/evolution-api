CREATE INDEX "Chat_instanceId_updatedAt_idx" ON "Chat"("instanceId", "updatedAt");
CREATE INDEX "Contact_instanceId_updatedAt_idx" ON "Contact"("instanceId", "updatedAt");
CREATE INDEX "Message_instanceId_messageTimestamp_idx" ON "Message"("instanceId", "messageTimestamp");
