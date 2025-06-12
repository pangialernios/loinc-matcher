#!/bin/bash

# Simple script to compile and run the import without ts-node
echo "Compiling import script..."
npx tsc scripts/import-loinc.ts --outDir scripts/.build --module commonjs --target es2020 --esModuleInterop --resolveJsonModule --skipLibCheck

# Load environment variables from .env.local
export $(grep -v '^#' .env.local | xargs)

echo "Running import script..."
node scripts/.build/scripts/import-loinc.js

echo "Cleaning up..."
rm -rf scripts/.build