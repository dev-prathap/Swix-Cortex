#!/usr/bin/env bun

/**
 * Manual Beta User Creation Script
 * Usage: bun run scripts/create-beta-user.ts
 * 
 * This script creates beta users manually for invite-only testing.
 * Use this for the first 10-20 beta users before building admin dashboard.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface BetaUser {
  email: string
  name: string
  password: string
}

async function createBetaUser(user: BetaUser) {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: user.email }
    })

    if (existing) {
      console.log(`❌ User already exists: ${user.email}`)
      return null
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(user.password, 10)
    
    // Create user with beta access
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        password: hashedPassword,
        inviteStatus: 'active',
        hasCompletedOnboarding: false,
        betaStage: 'beta',
        role: 'USER'
      }
    })
    
    console.log(`\n✅ BETA USER CREATED:`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Temp Password: ${user.password}`)
    console.log(`   Login: http://localhost:3000/login`)
    console.log(`\n📧 Send them these credentials via WhatsApp/Email`)
    
    return newUser
  } catch (error) {
    console.error(`❌ Error creating user ${user.email}:`, error)
    return null
  }
}

async function createMultipleBetaUsers(users: BetaUser[]) {
  console.log(`\n🚀 Creating ${users.length} beta users...\n`)
  
  let successCount = 0
  let failCount = 0

  for (const user of users) {
    const result = await createBetaUser(user)
    if (result) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 EDIT THIS SECTION - Add your beta users here
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const betaUsers: BetaUser[] = [
  {
    email: 'friend1@example.com',
    name: 'Friend One',
    password: 'BetaPass123!'
  },
  {
    email: 'friend2@example.com',
    name: 'Friend Two',
    password: 'BetaPass123!'
  },
  {
    email: 'friend3@example.com',
    name: 'Friend Three',
    password: 'BetaPass123!'
  },
  {
    email: 'friend4@example.com',
    name: 'Friend Four',
    password: 'BetaPass123!'
  },
  {
    email: 'friend5@example.com',
    name: 'Friend Five',
    password: 'BetaPass123!'
  },
  // Add more users here...
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  try {
    await createMultipleBetaUsers(betaUsers)
  } catch (error) {
    console.error('Fatal error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

