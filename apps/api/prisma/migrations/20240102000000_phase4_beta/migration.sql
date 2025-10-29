-- Phase 4 Beta schema updates

-- Documents
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "ownerId" TEXT NOT NULL,
    "parentId" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "documents_owner_status_idx" ON "documents" ("ownerId", "status");
CREATE INDEX "documents_createdAt_idx" ON "documents" ("createdAt");

ALTER TABLE "documents"
    ADD CONSTRAINT "documents_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "documents"
    ADD CONSTRAINT "documents_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "documents"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Tasks
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdById" TEXT NOT NULL,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tasks_createdBy_status_idx" ON "tasks" ("createdById", "status");
CREATE INDEX "tasks_assignee_status_idx" ON "tasks" ("assigneeId", "status");
CREATE INDEX "tasks_dueDate_idx" ON "tasks" ("dueDate");

ALTER TABLE "tasks"
    ADD CONSTRAINT "tasks_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tasks"
    ADD CONSTRAINT "tasks_assigneeId_fkey"
    FOREIGN KEY ("assigneeId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Feedback
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "userId" TEXT NOT NULL,
    "metadata" JSONB,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "feedback_user_status_idx" ON "feedback" ("userId", "status");
CREATE INDEX "feedback_type_status_idx" ON "feedback" ("type", "status");
CREATE INDEX "feedback_createdAt_idx" ON "feedback" ("createdAt");

ALTER TABLE "feedback"
    ADD CONSTRAINT "feedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Messages
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "threadId" TEXT,
    "replyToId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "readAt" TIMESTAMP(3),
    "attachments" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_sender_createdAt_idx" ON "messages" ("senderId", "createdAt");
CREATE INDEX "messages_receiver_isRead_idx" ON "messages" ("receiverId", "isRead");
CREATE INDEX "messages_thread_idx" ON "messages" ("threadId");

ALTER TABLE "messages"
    ADD CONSTRAINT "messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
    ADD CONSTRAINT "messages_receiverId_fkey"
    FOREIGN KEY ("receiverId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
    ADD CONSTRAINT "messages_replyToId_fkey"
    FOREIGN KEY ("replyToId") REFERENCES "messages"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Team Members
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Member',
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "team_members_userId_key" UNIQUE ("userId")
);

CREATE INDEX "team_members_role_status_idx" ON "team_members" ("role", "status");

ALTER TABLE "team_members"
    ADD CONSTRAINT "team_members_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Connectors
CREATE TABLE "connectors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "iconUrl" TEXT,
    "websiteUrl" TEXT,
    "authType" TEXT NOT NULL,
    "authConfig" JSONB NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT TRUE,
    "isVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "triggers" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "connectors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "connectors_name_key" UNIQUE ("name")
);

-- Connector Auth
CREATE TABLE "connector_auths" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "accountId" TEXT,
    "accountName" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "scope" TEXT,
    "tokenType" TEXT,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastUsedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "connector_auths_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "connector_auths_user_connector_account_idx" ON "connector_auths" ("userId", "connectorId", "accountId");
CREATE INDEX "connector_auths_user_connector_idx" ON "connector_auths" ("userId", "connectorId");

ALTER TABLE "connector_auths"
    ADD CONSTRAINT "connector_auths_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "connector_auths"
    ADD CONSTRAINT "connector_auths_connectorId_fkey"
    FOREIGN KEY ("connectorId") REFERENCES "connectors"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Trigger Config
CREATE TABLE "trigger_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "connectorAuthId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trigger_configs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trigger_configs_active_idx" ON "trigger_configs" ("connectorAuthId", "isActive");

ALTER TABLE "trigger_configs"
    ADD CONSTRAINT "trigger_configs_connectorAuthId_fkey"
    FOREIGN KEY ("connectorAuthId") REFERENCES "connector_auths"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Action Config
CREATE TABLE "action_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "connectorAuthId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "lastExecutedAt" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "action_configs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "action_configs_active_idx" ON "action_configs" ("connectorAuthId", "isActive");

ALTER TABLE "action_configs"
    ADD CONSTRAINT "action_configs_connectorAuthId_fkey"
    FOREIGN KEY ("connectorAuthId") REFERENCES "connector_auths"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Triggered by Prisma relation defaults
CREATE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updatedAt BEFORE UPDATE ON "documents"
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER update_tasks_updatedAt BEFORE UPDATE ON "tasks"
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER update_feedback_updatedAt BEFORE UPDATE ON "feedback"
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER update_team_members_updatedAt BEFORE UPDATE ON "team_members"
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER update_connectors_updatedAt BEFORE UPDATE ON "connectors"
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER update_connector_auths_updatedAt BEFORE UPDATE ON "connector_auths"
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER update_trigger_configs_updatedAt BEFORE UPDATE ON "trigger_configs"
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TRIGGER update_action_configs_updatedAt BEFORE UPDATE ON "action_configs"
FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
