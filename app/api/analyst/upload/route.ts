import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { RawStorageService } from "@/lib/storage/raw-storage";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-key-change-this-in-prod",
);

async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const name = (formData.get("name") as string | null) ?? undefined;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const rawStorage = new RawStorageService();
    const { dataset, rawVersion } = await rawStorage.createDatasetFromUpload({
      userId,
      name: name || file.name,
      originalFileName: file.name,
      fileBuffer: buffer,
    });

    // Convert BigInt to string for JSON serialization
    const safeDataset = JSON.parse(
      JSON.stringify(dataset, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );
    const safeRawVersion = JSON.parse(
      JSON.stringify(rawVersion, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    );

    return NextResponse.json(
      {
        dataset: safeDataset,
        rawVersion: safeRawVersion,
        message: "Upload successful. Raw data stored immutably.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Analyst upload error:", error);
    return NextResponse.json({ error: "Failed to upload dataset" }, { status: 500 });
  }
}


