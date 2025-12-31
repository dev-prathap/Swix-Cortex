import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { safeJsonResponse } from "@/lib/utils/serialization";
import { RawStorageService } from "@/lib/storage/raw-storage";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) {
    return safeJsonResponse({ error: "Unauthorized" }, { status: 401 });
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

    return safeJsonResponse(
      {
        dataset: dataset,
        rawVersion: rawVersion,
        message: "Upload successful. Raw data stored immutably.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Analyst upload error:", error);
    return safeJsonResponse({ error: "Failed to upload dataset" }, { status: 500 });
  }
}


