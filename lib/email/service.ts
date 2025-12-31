/**
 * Email Service for SWIXREPORT
 * Using Resend for transactional emails
 * 
 * Setup:
 * 1. npm install resend
 * 2. Add RESEND_API_KEY to .env
 * 3. Verify domain in Resend dashboard
 */

import { Resend } from 'resend'
import { WAITLIST_WELCOME, BETA_INVITE, ONBOARDING_COMPLETE } from './templates'

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key_for_build')

// Update this with your verified domain
const FROM_EMAIL = process.env.FROM_EMAIL || 'SWIXREPORT <onboarding@resend.dev>'

/**
 * Send welcome email when user joins waitlist
 */
export async function sendWaitlistWelcome(email: string, position: number) {
  try {
    const template = WAITLIST_WELCOME(email, position)
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    if (error) {
      console.error('[Email] Waitlist welcome failed:', error)
      return { success: false, error }
    }

    console.log(`[Email] Waitlist welcome sent to ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error('[Email] Waitlist welcome error:', error)
    return { success: false, error }
  }
}

/**
 * Send beta invite with login credentials
 */
export async function sendBetaInvite(
  name: string, 
  email: string, 
  tempPassword: string,
  loginUrl?: string
) {
  try {
    const template = BETA_INVITE(name, email, tempPassword, loginUrl)
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    if (error) {
      console.error('[Email] Beta invite failed:', error)
      return { success: false, error }
    }

    console.log(`[Email] Beta invite sent to ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error('[Email] Beta invite error:', error)
    return { success: false, error }
  }
}

/**
 * Send onboarding completion confirmation
 */
export async function sendOnboardingComplete(name: string, email: string) {
  try {
    const template = ONBOARDING_COMPLETE(name)
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    if (error) {
      console.error('[Email] Onboarding complete failed:', error)
      return { success: false, error }
    }

    console.log(`[Email] Onboarding complete sent to ${email}`)
    return { success: true, data }
  } catch (error) {
    console.error('[Email] Onboarding complete error:', error)
    return { success: false, error }
  }
}

/**
 * Generic email sender for custom use cases
 */
export async function sendEmail({
  to,
  subject,
  text,
  html
}: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text,
      html,
    })

    if (error) {
      console.error('[Email] Send failed:', error)
      return { success: false, error }
    }

    console.log(`[Email] Sent to ${to}`)
    return { success: true, data }
  } catch (error) {
    console.error('[Email] Send error:', error)
    return { success: false, error }
  }
}

