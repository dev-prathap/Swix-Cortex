#!/usr/bin/env node

/**
 * Patch DuckDB package.json to work with Next.js 16 Turbopack
 * Adds missing 'napi_versions' field to the binary section
 */

const fs = require('fs')
const path = require('path')

const packageJsonPath = path.join(__dirname, '..', 'node_modules', 'duckdb', 'package.json')

try {
  if (!fs.existsSync(packageJsonPath)) {
    console.log('ℹ️  DuckDB not installed yet, skipping patch')
    process.exit(0)
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

  // Check if already patched
  if (packageJson.binary && packageJson.binary.napi_versions) {
    console.log('✅ DuckDB already patched')
    process.exit(0)
  }

  // Add napi_versions field
  if (packageJson.binary) {
    packageJson.binary.napi_versions = [3]
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    console.log('✅ Patched DuckDB package.json for Next.js 16 Turbopack compatibility')
  } else {
    console.log('⚠️  DuckDB package.json has no binary section')
  }
} catch (error) {
  console.error('❌ Failed to patch DuckDB:', error.message)
  // Don't fail the install
  process.exit(0)
}

