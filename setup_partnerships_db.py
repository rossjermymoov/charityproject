#!/usr/bin/env python3
"""
Setup script for Corporate Partnership Tracking Module
Creates CorporatePartnership and PartnershipActivity tables
"""

import psycopg2
from psycopg2 import sql
from decimal import Decimal
from datetime import datetime

# Database connection
DATABASE_URL = "postgresql://postgres:yjSVCgwnJabUGzuXzZXrbpvQNnmHXJZD@gondola.proxy.rlwy.net:34856/railway"

def create_tables():
    """Create the partnership-related tables"""
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    try:
        # Create CorporatePartnership table
        create_partnership_sql = """
        CREATE TABLE IF NOT EXISTS "CorporatePartnership" (
            id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "organisationId" VARCHAR(30) NOT NULL,
            type VARCHAR(50) NOT NULL CHECK (type IN ('SPONSOR', 'PARTNER', 'PATRON', 'CORPORATE_DONOR')),
            status VARCHAR(50) NOT NULL CHECK (status IN ('PROSPECT', 'ACTIVE', 'LAPSED', 'ENDED')) DEFAULT 'PROSPECT',
            "startDate" TIMESTAMP WITH TIME ZONE,
            "endDate" TIMESTAMP WITH TIME ZONE,
            "annualValue" NUMERIC(19, 2),
            "totalValue" NUMERIC(19, 2),
            "contactId" VARCHAR(30),
            notes TEXT,
            benefits JSONB DEFAULT '[]'::jsonb,
            "renewalDate" TIMESTAMP WITH TIME ZONE,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("organisationId") REFERENCES "Organisation"(id) ON DELETE CASCADE,
            FOREIGN KEY ("contactId") REFERENCES "Contact"(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS "CorporatePartnership_organisationId_idx"
            ON "CorporatePartnership"("organisationId");
        CREATE INDEX IF NOT EXISTS "CorporatePartnership_contactId_idx"
            ON "CorporatePartnership"("contactId");
        CREATE INDEX IF NOT EXISTS "CorporatePartnership_status_idx"
            ON "CorporatePartnership"(status);
        CREATE INDEX IF NOT EXISTS "CorporatePartnership_type_idx"
            ON "CorporatePartnership"(type);
        CREATE INDEX IF NOT EXISTS "CorporatePartnership_createdAt_idx"
            ON "CorporatePartnership"("createdAt");
        """

        cursor.execute(create_partnership_sql)
        print("✓ Created CorporatePartnership table")

        # Create PartnershipActivity table
        create_activity_sql = """
        CREATE TABLE IF NOT EXISTS "PartnershipActivity" (
            id VARCHAR(30) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            "partnershipId" VARCHAR(30) NOT NULL,
            type VARCHAR(50) NOT NULL CHECK (type IN ('MEETING', 'EMAIL', 'CALL', 'EVENT', 'PAYMENT', 'NOTE')),
            date TIMESTAMP WITH TIME ZONE NOT NULL,
            description TEXT,
            "userId" VARCHAR(30),
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("partnershipId") REFERENCES "CorporatePartnership"(id) ON DELETE CASCADE,
            FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS "PartnershipActivity_partnershipId_idx"
            ON "PartnershipActivity"("partnershipId");
        CREATE INDEX IF NOT EXISTS "PartnershipActivity_userId_idx"
            ON "PartnershipActivity"("userId");
        CREATE INDEX IF NOT EXISTS "PartnershipActivity_type_idx"
            ON "PartnershipActivity"(type);
        CREATE INDEX IF NOT EXISTS "PartnershipActivity_date_idx"
            ON "PartnershipActivity"(date);
        """

        cursor.execute(create_activity_sql)
        print("✓ Created PartnershipActivity table")

        # Commit the changes
        conn.commit()
        print("\n✓ Database tables created successfully!")

    except psycopg2.Error as e:
        print(f"✗ Error creating tables: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

    return True

if __name__ == "__main__":
    print("Setting up Corporate Partnership Tracking Module...")
    print(f"Database: {DATABASE_URL}")
    print()

    if create_tables():
        print("\nSetup complete!")
    else:
        print("\nSetup failed!")
        exit(1)
