#!/bin/bash

# Script to clean up unnecessary migration files
# This script removes migration files that are now part of database_schema.sql

echo "Cleaning up unnecessary migration files..."

# List of files to remove
FILES_TO_REMOVE=(
    "000001_init_schema.up.sql"
    "000001_init_schema.down.sql"
    "000002_add_cover_images.up.sql"
    "000002_add_cover_images.down.sql"
    "000003_add_default_admin.up.sql"
    "000003_add_default_admin.down.sql"
)

# Directory containing migration files
MIGRATIONS_DIR="../migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo "Error: Migrations directory not found at $MIGRATIONS_DIR"
    exit 1
fi

# Remove each file
for file in "${FILES_TO_REMOVE[@]}"; do
    file_path="$MIGRATIONS_DIR/$file"
    if [ -f "$file_path" ]; then
        rm "$file_path"
        echo "Removed: $file"
    else
        echo "Warning: File not found: $file"
    fi
done

echo "Cleanup complete!" 