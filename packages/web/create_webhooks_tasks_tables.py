#!/usr/bin/env python3
"""
Create Webhook, WebhookLog, TaskRule, and AutoTask tables for DeepCharity CRM
"""

import psycopg2
from datetime import datetime

# Database connection
conn = psycopg2.connect(
    "postgresql://postgres:yjSVCgwnJabUGzuXzZXrbpvQNnmHXJZD@gondola.proxy.rlwy.net:34856/railway"
)
cursor = conn.cursor()

try:
    # ============================================
    # WEBHOOKS FEATURE
    # ============================================

    print("Creating Webhook table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "Webhook" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            events JSONB NOT NULL DEFAULT '[]',
            secret TEXT,
            "isActive" BOOLEAN DEFAULT true,
            "lastTriggeredAt" TIMESTAMP,
            "failCount" INTEGER DEFAULT 0,
            "createdById" TEXT NOT NULL,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("createdById") REFERENCES "User"(id) ON DELETE CASCADE
        )
    """)
    print("✓ Webhook table created")

    print("Creating WebhookLog table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "WebhookLog" (
            id TEXT PRIMARY KEY,
            "webhookId" TEXT NOT NULL,
            event TEXT NOT NULL,
            payload JSONB NOT NULL,
            "statusCode" INTEGER,
            response TEXT,
            success BOOLEAN NOT NULL,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("webhookId") REFERENCES "Webhook"(id) ON DELETE CASCADE
        )
    """)
    print("✓ WebhookLog table created")

    # Create indices for webhooks
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS "idx_webhook_createdById"
        ON "Webhook"("createdById")
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS "idx_webhook_isActive"
        ON "Webhook"("isActive")
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS "idx_webhooklog_webhookId"
        ON "WebhookLog"("webhookId")
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS "idx_webhooklog_createdAt"
        ON "WebhookLog"("createdAt")
    """)
    print("✓ Webhook indices created")

    # ============================================
    # TASK ASSIGNMENT AUTOMATION FEATURE
    # ============================================

    print("Creating TaskRule table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "TaskRule" (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            "triggerEvent" TEXT NOT NULL,
            conditions JSONB NOT NULL DEFAULT '{}',
            "assignToUserId" TEXT,
            "assignToRole" TEXT,
            "taskTitle" TEXT NOT NULL,
            "taskDescription" TEXT,
            "dueDays" INTEGER DEFAULT 7,
            priority TEXT DEFAULT 'MEDIUM',
            "isActive" BOOLEAN DEFAULT true,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("assignToUserId") REFERENCES "User"(id) ON DELETE SET NULL
        )
    """)
    print("✓ TaskRule table created")

    print("Creating AutoTask table...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS "AutoTask" (
            id TEXT PRIMARY KEY,
            "ruleId" TEXT,
            title TEXT NOT NULL,
            description TEXT,
            "assignedToId" TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            priority TEXT DEFAULT 'MEDIUM',
            "dueDate" TIMESTAMP,
            "completedAt" TIMESTAMP,
            "relatedContactId" TEXT,
            "relatedDonationId" TEXT,
            "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("ruleId") REFERENCES "TaskRule"(id) ON DELETE SET NULL,
            FOREIGN KEY ("assignedToId") REFERENCES "User"(id) ON DELETE CASCADE,
            FOREIGN KEY ("relatedContactId") REFERENCES "Contact"(id) ON DELETE SET NULL
        )
    """)
    print("✓ AutoTask table created")

    # Create indices for task rules
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS "idx_taskrule_triggerEvent"
        ON "TaskRule"("triggerEvent")
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS "idx_taskrule_isActive"
        ON "TaskRule"("isActive")
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS "idx_autotask_ruleId"
        ON "AutoTask"("ruleId")
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS "idx_autotask_assignedToId"
        ON "AutoTask"("assignedToId")
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS "idx_autotask_status"
        ON "AutoTask"(status)
    """)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS "idx_autotask_relatedContactId"
        ON "AutoTask"("relatedContactId")
    """)
    print("✓ Task rule indices created")

    # Commit all changes
    conn.commit()
    print("\n✅ All tables created successfully!")

except Exception as e:
    conn.rollback()
    print(f"❌ Error: {e}")
    exit(1)
finally:
    cursor.close()
    conn.close()
