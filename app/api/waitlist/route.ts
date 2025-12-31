import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendWaitlistWelcome } from "@/lib/email/service"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name, company, useCase, source = "landing", referredBy } = body

    // Basic validation
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      )
    }

    // Check if already on waitlist
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json(
        { error: "You're already on the waitlist!" },
        { status: 400 }
      )
    }

    // Add to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        email,
        name: name || null,
        company: company || null,
        useCase: useCase || null,
        source,
        referredBy: referredBy || null,
        priority: referredBy ? 10 : 0 // Referrals get higher priority
      }
    })

    // Get position in waitlist
    const position = await prisma.waitlist.count({
      where: {
        createdAt: {
          lte: waitlistEntry.createdAt
        }
      }
    })

    // Send welcome email (async, don't wait)
    sendWaitlistWelcome(email, position).catch(err => {
      console.error('Failed to send waitlist email:', err)
      // Don't fail the API call if email fails
    })

    return NextResponse.json({
      success: true,
      message: "You're on the waitlist!",
      position,
      email
    })

  } catch (error: any) {
    console.error("Waitlist signup error:", error)

    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    )
  }
}

// Get waitlist stats (admin only)
export async function GET(req: Request) {
  try {
    const total = await prisma.waitlist.count()
    const pending = await prisma.waitlist.count({
      where: { status: "pending" }
    })
    const invited = await prisma.waitlist.count({
      where: { status: "invited" }
    })

    return NextResponse.json({
      total,
      pending,
      invited,
      converted: total - pending - invited
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}

