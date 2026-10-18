import { prisma } from "../db";
import { getStorageAdapter } from "../storage";

export async function getMediaFilesAction() {
  return prisma.fileAndImage.findMany({
    orderBy: { created_date: "desc" },
    include: {
      _count: {
        select: {
          galleries: true,
          page_fields: true,
        },
      },
    },
  });
}

export async function uploadMediaAction(
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  mimeType?: string
) {
  const storage = getStorageAdapter();
  const uploadResult = await storage.upload(fileBuffer, fileName, mimeType);

  const fileRecord = await prisma.fileAndImage.create({
    data: {
      file_name: uploadResult.fileName,
      file_url: uploadResult.fileUrl,
    },
  });

  return fileRecord;
}

export async function deleteMediaAction(id: string) {
  const fileRecord = await prisma.fileAndImage.findUnique({
    where: { id },
  });

  if (!fileRecord) {
    return false;
  }

  const storage = getStorageAdapter();
  await storage.delete(fileRecord.file_url);

  await prisma.fileAndImage.delete({
    where: { id },
  });

  return true;
}
