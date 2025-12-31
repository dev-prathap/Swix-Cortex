import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserId } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const userId = await getUserId()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Complete onboarding error:", error)
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    )
  }
}

