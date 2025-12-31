import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function GET() {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                profilePicture: true,
                timezone: true,
                createdAt: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error: any) {
        console.error("[Profile] GET failed:", error);
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    const userId = await getUserId();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, timezone, profilePicture } = body;

        // Validate input
        if (name !== undefined && typeof name !== 'string') {
            return NextResponse.json({ error: "Invalid name" }, { status: 400 });
        }

        if (timezone !== undefined && typeof timezone !== 'string') {
            return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
        }

        // Build update object
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (timezone !== undefined) updateData.timezone = timezone;
        if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                profilePicture: true,
                timezone: true,
                createdAt: true
            }
        });

        return NextResponse.json({
            success: true,
            user
        });
    } catch (error: any) {
        console.error("[Profile] PATCH failed:", error);
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}

