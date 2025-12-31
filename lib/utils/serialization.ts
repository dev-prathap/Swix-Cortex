/**
 * Safely stringifies an object that might contain BigInt values.
 * Next.js/Vercel and standard JSON.stringify fail on BigInt.
 */
export function safeJsonSerialize(data: any): any {
    return JSON.parse(
        JSON.stringify(data, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
        )
    );
}

/**
 * A wrapper for NextResponse.json that handles BigInt automatically.
 */
import { NextResponse } from "next/server";

export function safeJsonResponse(data: any, init?: ResponseInit) {
    return NextResponse.json(safeJsonSerialize(data), init);
}
