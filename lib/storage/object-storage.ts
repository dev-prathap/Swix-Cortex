import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import * as fs from "fs/promises";
import { createReadStream } from "fs";
import * as path from "path";

// Check if we should use local storage as fallback
const USE_LOCAL_STORAGE = process.env.USE_LOCAL_STORAGE === 'true' || !process.env.OBJECT_STORAGE_ENDPOINT;
const LOCAL_STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || './data/uploads';

const endpoint = process.env.OBJECT_STORAGE_ENDPOINT;
const region = process.env.OBJECT_STORAGE_REGION || "auto";
const accessKeyId = process.env.OBJECT_STORAGE_ACCESS_KEY;
const secretAccessKey = process.env.OBJECT_STORAGE_SECRET_KEY;
const bucket = process.env.OBJECT_STORAGE_BUCKET;

if (!bucket && !USE_LOCAL_STORAGE) {
  console.warn("[ObjectStorage] OBJECT_STORAGE_BUCKET is not set. Uploads will fail until configured.");
}

const s3Client =
  !USE_LOCAL_STORAGE && endpoint && accessKeyId && secretAccessKey
    ? new S3Client({
        region,
        endpoint,
        forcePathStyle: false,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
    : null;

if (USE_LOCAL_STORAGE) {
  console.log("[ObjectStorage] Using LOCAL file storage at:", LOCAL_STORAGE_PATH);
}

export class ObjectStorage {
  private async ensureLocalDir(dirPath: string) {
    await fs.mkdir(dirPath, { recursive: true });
  }

  private getLocalPath(key: string): string {
    return path.join(LOCAL_STORAGE_PATH, key);
  }

  private getClient() {
    if (!s3Client || !bucket) {
      throw new Error("Object storage is not configured. Please set OBJECT_STORAGE_* env vars.");
    }
    return { s3Client, bucket };
  }

  async uploadRaw(file: Buffer, datasetId: string, fileName: string): Promise<string> {
    const key = `datasets/${datasetId}/raw/${fileName}`;

    // Local storage fallback
    if (USE_LOCAL_STORAGE) {
      const filePath = this.getLocalPath(key);
      await this.ensureLocalDir(path.dirname(filePath));
      await fs.writeFile(filePath, file);
      console.log("[ObjectStorage] Saved locally:", filePath);
      return key;
    }

    // R2/S3 storage
    const { s3Client, bucket } = this.getClient();
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
      }),
    );

    return key;
  }

  async createVersion(datasetId: string, versionNum: number, data: Buffer): Promise<string> {
    const key = `datasets/${datasetId}/versions/v${versionNum}.parquet`;

    // Local storage fallback
    if (USE_LOCAL_STORAGE) {
      const filePath = this.getLocalPath(key);
      await this.ensureLocalDir(path.dirname(filePath));
      await fs.writeFile(filePath, data);
      console.log("[ObjectStorage] Version saved locally:", filePath);
      return key;
    }

    // R2/S3 storage
    const { s3Client, bucket } = this.getClient();
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
      }),
    );

    return key;
  }

  async downloadRaw(location: string): Promise<Readable> {
    // Local storage fallback
    if (USE_LOCAL_STORAGE) {
      const filePath = this.getLocalPath(location);
      return createReadStream(filePath);
    }

    // R2/S3 storage
    const { s3Client, bucket } = this.getClient();
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: location,
      }),
    );

    const body = response.Body;
    if (!body || !(body instanceof Readable)) {
      throw new Error("Unexpected object storage response body.");
    }
    return body;
  }
}


