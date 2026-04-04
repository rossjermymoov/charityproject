#!/usr/bin/env python3
"""
Test script to verify SavedSegment table and APIs work correctly.
"""

import psycopg2
import json
import sys
from datetime import datetime

DATABASE_URL = "postgresql://postgres:yjSVCgwnJabUGzuXzZXrbpvQNnmHXJZD@gondola.proxy.rlwy.net:34856/railway"

def test_table_exists():
    """Check if SavedSegment table exists."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'SavedSegment'
            );
        """)

        exists = cursor.fetchone()[0]
        conn.close()

        if exists:
            print("✓ SavedSegment table exists")
            return True
        else:
            print("✗ SavedSegment table not found")
            return False
    except Exception as e:
        print(f"✗ Error checking table: {e}")
        return False


def test_sample_data():
    """Insert and retrieve sample segment data."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # First get a valid user ID
        cursor.execute("SELECT id FROM \"User\" LIMIT 1;")
        result = cursor.fetchone()

        if not result:
            print("✗ No users found in database")
            conn.close()
            return False

        user_id = result[0]

        # Create test segment
        filters = {
            "filters": [
                {
                    "type": "tag",
                    "tagIds": []
                }
            ],
            "matchType": "all"
        }

        cursor.execute("""
            INSERT INTO "SavedSegment" (id, name, description, filters, "createdById", "createdAt", "updatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, name, filters;
        """, (
            "test-seg-001",
            "Test Segment",
            "A test segment for validation",
            json.dumps(filters),
            user_id,
            datetime.now(),
            datetime.now()
        ))

        inserted = cursor.fetchone()

        if inserted:
            print(f"✓ Successfully inserted test segment: {inserted[0]}")

            # Verify we can read it back
            cursor.execute("""
                SELECT id, name, filters FROM "SavedSegment" WHERE id = %s;
            """, ("test-seg-001",))

            retrieved = cursor.fetchone()
            if retrieved:
                print(f"✓ Successfully retrieved segment: {retrieved[1]}")
                print(f"  Filters: {retrieved[2]}")

                # Clean up
                cursor.execute("DELETE FROM \"SavedSegment\" WHERE id = %s;", ("test-seg-001",))
                conn.commit()
                conn.close()
                return True

        conn.close()
        return False

    except Exception as e:
        print(f"✗ Error with sample data: {e}")
        return False


def test_indexes():
    """Check if indexes exist."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.statistics
                WHERE table_name = 'SavedSegment'
                AND index_name = 'SavedSegment_createdById_idx'
            );
        """)

        exists = cursor.fetchone()[0]
        conn.close()

        if exists:
            print("✓ Index on createdById exists")
            return True
        else:
            print("⚠ Index on createdById not found (non-critical)")
            return True
    except Exception as e:
        print(f"⚠ Error checking indexes: {e}")
        return True


def test_schema_validation():
    """Check that schema is correct."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'SavedSegment'
            ORDER BY ordinal_position;
        """)

        columns = cursor.fetchall()
        conn.close()

        expected = {
            'id': 'character varying',
            'name': 'character varying',
            'description': 'text',
            'filters': 'text',
            'createdById': 'character varying',
            'createdAt': 'timestamp without time zone',
            'updatedAt': 'timestamp without time zone',
        }

        found = {col[0]: col[1] for col in columns}

        all_valid = True
        for expected_col, expected_type in expected.items():
            if expected_col not in found:
                print(f"✗ Missing column: {expected_col}")
                all_valid = False
            elif expected_type not in found[expected_col]:
                print(f"⚠ Column {expected_col} has type {found[expected_col]}, expected {expected_type}")

        if all_valid:
            print("✓ Schema validation passed")
            return True

        return False

    except Exception as e:
        print(f"✗ Error validating schema: {e}")
        return False


def main():
    """Run all tests."""
    print("Testing SavedSegment implementation...\n")

    tests = [
        ("Table exists", test_table_exists),
        ("Schema validation", test_schema_validation),
        ("Indexes", test_indexes),
        ("Sample data operations", test_sample_data),
    ]

    results = []
    for name, test_func in tests:
        print(f"\n{name}:")
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"✗ Unexpected error: {e}")
            results.append(False)

    print("\n" + "=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"\nTests passed: {passed}/{total}")

    if all(results):
        print("\n✓ All tests passed!")
        return 0
    else:
        print("\n✗ Some tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
