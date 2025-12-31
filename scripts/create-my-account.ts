#!/usr/bin/env bun

/**
 * Create Personal Admin Account
 * One-time script to create your account
 */

import prisma from '../lib/prisma'
import bcrypt from 'bcryptjs'

async function createMyAccount() {
  try {
    const email = 'prathap@swix.com'
    const password = 'prathap@2000'
    const name = 'Prathap'

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      console.log(`\n⚠️  Account already exists: ${email}`)
      console.log(`\nIf you forgot password, delete the user in Prisma Studio and run this again.`)
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Create user with ADMIN access
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        inviteStatus: 'active',
        hasCompletedOnboarding: true, // Skip onboarding for you
        betaStage: 'beta',
        role: 'ADMIN' // Admin role for full access
      }
    })
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`✅ YOUR ACCOUNT CREATED!`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`\n📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`👑 Role: ADMIN`)
    console.log(`🚀 Login: http://localhost:3000/login`)
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
    
    return user
  } catch (error) {
    console.error(`\n❌ Error creating account:`, error)
  } finally {
    await prisma.$disconnect()
  }
}

createMyAccount()

