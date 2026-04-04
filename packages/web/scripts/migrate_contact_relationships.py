#!/usr/bin/env python3
"""
Migration script to ensure ContactRelationship table exists with proper fields.
This script uses psycopg2 to connect to the PostgreSQL database and create
the ContactRelationship table if it doesn't exist.
"""

import psycopg2
from psycopg2 import sql
import os
import sys
from urllib.parse import urlparse

def get_database_url():
    """Get database URL from environment or use default."""
    db_url = os.environ.get(
        'DATABASE_URL',
        'postgresql://postgres:yjSVCgwnJabUGzuXzZXrbpvQNnmHXJZD@gondola.proxy.rlwy.net:34856/railway'
    )
    return db_url

def parse_database_url(url):
    """Parse PostgreSQL connection URL."""
    parsed = urlparse(url)
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'user': parsed.username or 'postgres',
        'password': parsed.password or '',
        'database': parsed.path.lstrip('/') or 'railway'
    }

def create_connection(db_params):
    """Create a database connection."""
    try:
        conn = psycopg2.connect(
            host=db_params['host'],
            port=db_params['port'],
            user=db_params['user'],
            password=db_params['password'],
            database=db_params['database']
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def table_exists(conn, table_name):
    """Check if a table exists in the database."""
    cursor = conn.cursor()
    try:
        cursor.execute(
            sql.SQL("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_name = %s
                )
            """),
            [table_name]
        )
        result = cursor.fetchone()[0]
        return result
    finally:
        cursor.close()

def create_contact_relationship_table(conn):
    """Create the ContactRelationship table."""
    cursor = conn.cursor()
    try:
        # Create table with proper constraints
        cursor.execute("""
            CREATE TABLE "ContactRelationship" (
                id VARCHAR(191) NOT NULL PRIMARY KEY,
                "fromContactId" VARCHAR(191) NOT NULL,
                "toContactId" VARCHAR(191) NOT NULL,
                type VARCHAR(191) NOT NULL,
                description TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "ContactRelationship_fromContactId_fkey"
                    FOREIGN KEY ("fromContactId") REFERENCES "Contact"(id) ON DELETE CASCADE,
                CONSTRAINT "ContactRelationship_toContactId_fkey"
                    FOREIGN KEY ("toContactId") REFERENCES "Contact"(id) ON DELETE CASCADE,
                CONSTRAINT "ContactRelationship_fromContactId_toContactId_type_key"
                    UNIQUE ("fromContactId", "toContactId", type)
            )
        """)
        cursor.execute("""
            CREATE INDEX "ContactRelationship_fromContactId_idx"
            ON "ContactRelationship"("fromContactId")
        """)
        cursor.execute("""
            CREATE INDEX "ContactRelationship_toContactId_idx"
            ON "ContactRelationship"("toContactId")
        """)
        conn.commit()
        print("ContactRelationship table created successfully!")
        return True
    except psycopg2.Error as e:
        conn.rollback()
        print(f"Error creating table: {e}")
        return False
    finally:
        cursor.close()

def verify_table_structure(conn):
    """Verify the table structure matches expectations."""
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'ContactRelationship'
            ORDER BY ordinal_position
        """)
        columns = cursor.fetchall()

        print("\nTable structure:")
        print("-" * 60)
        for col_name, data_type, is_nullable in columns:
            nullable_str = "NULL" if is_nullable == "YES" else "NOT NULL"
            print(f"  {col_name:20} {data_type:20} {nullable_str}")
        print("-" * 60)

        return True
    except psycopg2.Error as e:
        print(f"Error verifying table structure: {e}")
        return False
    finally:
        cursor.close()

def main():
    """Main migration function."""
    print("DeepCharity ContactRelationship Migration Script")
    print("=" * 60)

    # Get database URL and parse it
    db_url = get_database_url()
    db_params = parse_database_url(db_url)

    print(f"Connecting to database: {db_params['host']}:{db_params['port']}/{db_params['database']}")

    # Connect to database
    conn = create_connection(db_params)

    try:
        # Check if table already exists
        if table_exists(conn, 'ContactRelationship'):
            print("ContactRelationship table already exists.")
            verify_table_structure(conn)
        else:
            print("ContactRelationship table does not exist. Creating...")
            if create_contact_relationship_table(conn):
                verify_table_structure(conn)
            else:
                print("Failed to create table.")
                sys.exit(1)

        print("\nMigration completed successfully!")
        return 0
    finally:
        conn.close()

if __name__ == '__main__':
    sys.exit(main())
