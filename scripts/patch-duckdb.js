#!/usr/bin/env node

/**
 * Patch DuckDB package.json to add missing napi_versions field
 * Required for Turbopack compatibility in Next.js 16
 */

const fs = require('fs');
const path = require('path');

try {
  const duckdbPackagePath = path.join(__dirname, '../node_modules/duckdb/package.json');
  
  if (!fs.existsSync(duckdbPackagePath)) {
    console.log('⚠️  DuckDB not found, skipping patch');
    process.exit(0);
  }

  const packageJson = JSON.parse(fs.readFileSync(duckdbPackagePath, 'utf8'));
  
  // Add napi_versions if missing
  if (packageJson.binary && !packageJson.binary.napi_versions) {
    packageJson.binary.napi_versions = [3, 4, 5, 6, 7, 8];
    fs.writeFileSync(duckdbPackagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ DuckDB package.json patched successfully');
  } else {
    console.log('ℹ️  DuckDB already patched or no binary field found');
  }
  
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to patch DuckDB:', error.message);
  process.exit(0); // Don't fail the install
}
