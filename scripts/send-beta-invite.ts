#!/usr/bin/env bun

/**
 * Send Beta Invite Email Script
 * 
 * Run this AFTER creating beta users with create-beta-user.ts
 * This will send professional invite emails with credentials
 * 
 * Usage: bun run scripts/send-beta-invite.ts
 */

import { sendBetaInvite } from '../lib/email/service'

interface InviteData {
  name: string
  email: string
  tempPassword: string
}

async function sendInvites(invites: InviteData[]) {
  console.log(`\n📧 Sending ${invites.length} beta invite emails...\n`)
  
  let successCount = 0
  let failCount = 0

  for (const invite of invites) {
    const result = await sendBetaInvite(
      invite.name,
      invite.email,
      invite.tempPassword,
      process.env.NEXT_PUBLIC_APP_URL + '/login' || 'http://localhost:3000/login'
    )

    if (result.success) {
      console.log(`✅ Sent to ${invite.email}`)
      successCount++
    } else {
      console.log(`❌ Failed: ${invite.email}`)
      failCount++
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 EDIT THIS SECTION - Match the users you created
// Copy from create-beta-user.ts output
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const invites: InviteData[] = [
  {
    name: 'Friend One',
    email: 'friend1@example.com',
    tempPassword: 'BetaPass123!'
  },
  {
    name: 'Friend Two',
    email: 'friend2@example.com',
    tempPassword: 'BetaPass123!'
  },
  // Add more...
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  // Check if RESEND_API_KEY is set
  if (!process.env.RESEND_API_KEY) {
    console.error('\n❌ ERROR: RESEND_API_KEY not found in .env file!')
    console.log('\n📝 Setup instructions:')
    console.log('1. Sign up at https://resend.com')
    console.log('2. Get your API key')
    console.log('3. Add to .env: RESEND_API_KEY=re_...')
    console.log('4. Run this script again\n')
    process.exit(1)
  }

  await sendInvites(invites)
}

main()

