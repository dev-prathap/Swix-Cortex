import prisma from "@/lib/prisma";
import { ObjectStorage } from "@/lib/storage/object-storage";

export class RawStorageService {
  private objectStorage = new ObjectStorage();

  async createDatasetFromUpload(params: {
    userId: string;
    name: string;
    originalFileName: string;
    fileBuffer: Buffer;
    dataSourceId?: string;
  }) {
    const { userId, name, originalFileName, fileBuffer, dataSourceId } = params;

    // 1. Create dataset record in DB
    const dataset = await prisma.dataset.create({
      data: {
        userId,
        name,
        originalFileName,
        rawFileLocation: "",
        fileSize: BigInt(fileBuffer.byteLength),
        dataSourceId: dataSourceId || null,
      } as any,
    });

    // 2. Upload raw file to object storage (immutable)
    const key = await this.objectStorage.uploadRaw(fileBuffer, dataset.id, originalFileName);

    // 3. Create RAW version (versionNumber = 0)
    const version = await prisma.datasetVersion.create({
      data: {
        datasetId: dataset.id,
        versionNumber: 0,
        versionType: "RAW",
        fileLocation: key,
      },
    });

    // 4. Update dataset with raw file location
    const updated = await prisma.dataset.update({
      where: { id: dataset.id },
      data: {
        rawFileLocation: key,
        status: "UPLOADED",
      },
      include: {
        versions: true,
      },
    });

    return { dataset: updated, rawVersion: version };
  }
}


