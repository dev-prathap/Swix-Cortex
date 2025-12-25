import prisma from "@/lib/prisma";
import { ObjectStorage } from "@/lib/storage/object-storage";

import type { CleaningAction } from "@/lib/agents/cleaning-agent";

export class VersionManager {
  private objectStorage = new ObjectStorage();

  /**
   * For MVP we simply duplicate the raw file into a new version.
   * Later we can apply real transformations based on CleaningActions.
   */
  async createVersion(params: {
    datasetId: string;
    type: "RAW" | "CLEANED" | "USER_MODIFIED";
    cleaningActions?: CleaningAction[];
    sourceLocation?: string;
  }) {
    const { datasetId, type, cleaningActions, sourceLocation } = params;

    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
    });

    if (!dataset) {
      throw new Error("Dataset not found");
    }

    const currentVersions = await prisma.datasetVersion.findMany({
      where: { datasetId },
      orderBy: { versionNumber: "desc" },
      take: 1,
    });

    const nextVersionNumber = currentVersions.length ? currentVersions[0].versionNumber + 1 : 1;
    const fromLocation = sourceLocation ?? dataset.rawFileLocation;

    // Download source file and re-upload as new version
    const rawStream = await this.objectStorage.downloadRaw(fromLocation);
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      rawStream.on("data", (chunk) => chunks.push(chunk));
      rawStream.on("end", () => resolve());
      rawStream.on("error", (err) => reject(err));
    });

    const buffer = Buffer.concat(chunks);
    const key = await this.objectStorage.createVersion(datasetId, nextVersionNumber, buffer);

    const version = await prisma.datasetVersion.create({
      data: {
        datasetId,
        versionNumber: nextVersionNumber,
        versionType: type,
        fileLocation: key,
        cleaningActions: (cleaningActions ?? []) as any,
      },
    });

    await prisma.dataset.update({
      where: { id: datasetId },
      data: {
        status: type === "CLEANED" ? "CLEANED" : dataset.status,
      },
    });

    return version;
  }

  async getVersionHistory(datasetId: string) {
    return prisma.datasetVersion.findMany({
      where: { datasetId },
      orderBy: { versionNumber: "asc" },
    });
  }

  /**
   * Rollback to a specific version by creating a new version from the target
   */
  async rollback(datasetId: string, targetVersionNumber: number) {
    const targetVersion = await prisma.datasetVersion.findFirst({
      where: {
        datasetId,
        versionNumber: targetVersionNumber,
      },
    });

    if (!targetVersion) {
      throw new Error(`Version ${targetVersionNumber} not found`);
    }

    // Create a new version from the target version's file
    return this.createVersion({
      datasetId,
      type: "USER_MODIFIED",
      sourceLocation: targetVersion.fileLocation,
      cleaningActions: targetVersion.cleaningActions as any,
    });
  }
}


