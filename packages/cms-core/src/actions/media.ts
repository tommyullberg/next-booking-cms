import fs from "fs/promises";
import path from "path";
import { prisma } from "../db";
import { getStorageAdapter } from "../storage";

function generateFolderSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/[ö]/g, "o")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `folder-${Date.now()}`;
}

function getExtensionFromContentType(contentType?: string | null): string {
  if (!contentType) return ".jpg";
  const lower = contentType.toLowerCase();
  if (lower.includes("png")) return ".png";
  if (lower.includes("webp")) return ".webp";
  if (lower.includes("gif")) return ".gif";
  if (lower.includes("svg")) return ".svg";
  if (lower.includes("avif")) return ".avif";
  if (lower.includes("pdf")) return ".pdf";
  return ".jpg";
}

function extractCleanFileName(urlStr: string, contentType?: string | null, preferredName?: string): string {
  if (preferredName && /\.(jpg|jpeg|png|webp|gif|svg|avif|pdf)$/i.test(preferredName)) {
    return preferredName.replace(/[^a-zA-Z0-9._-]/g, "_");
  }
  try {
    const parsed = new URL(urlStr);
    const base = path.basename(parsed.pathname).replace(/[^a-zA-Z0-9._-]/g, "_");
    if (base && /\.(jpg|jpeg|png|webp|gif|svg|avif|pdf)$/i.test(base)) {
      return base;
    }
    const ext = getExtensionFromContentType(contentType);
    return `${base || "external-image"}${ext}`;
  } catch {
    const ext = getExtensionFromContentType(contentType);
    return `external-image${ext}`;
  }
}

/**
 * Downloads an external http/https image URL, stores it as a physical file via the active
 * StorageAdapter, and creates or updates the FileAndImage record in the database.
 */
export async function ensureLocalMediaFromUrl(
  imageUrl: string,
  folderId?: string | null,
  existingRecordId?: string,
  preferredFileName?: string
) {
  const trimmedUrl = imageUrl.trim();
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    let record = await prisma.fileAndImage.findFirst({
      where: { file_url: trimmedUrl },
    });
    if (!record) {
      const fileName = trimmedUrl.split("/").pop() || "uploaded-image";
      record = await prisma.fileAndImage.create({
        data: {
          file_name: fileName,
          file_url: trimmedUrl,
          folder_id: folderId || null,
        },
      });
    }
    return record;
  }

  let folderSlug: string | null = null;
  let validFolderId: string | null = null;
  if (folderId) {
    const folder = await prisma.mediaFolder.findUnique({ where: { id: folderId } });
    if (folder) {
      folderSlug = folder.slug;
      validFolderId = folder.id;
    }
  }

  const response = await fetch(trimmedUrl);
  if (!response.ok) {
    throw new Error(`Failed to download external image (${response.status})`);
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const cleanName = extractCleanFileName(trimmedUrl, contentType, preferredFileName);

  const storage = getStorageAdapter();
  const uploadResult = await storage.upload(buffer, cleanName, contentType, folderSlug);

  let fileRecord;
  if (existingRecordId) {
    fileRecord = await prisma.fileAndImage.update({
      where: { id: existingRecordId },
      data: {
        file_name: uploadResult.fileName,
        file_url: uploadResult.fileUrl,
        folder_id: validFolderId,
      },
      include: {
        folder: true,
        _count: { select: { galleries: true, page_fields: true } },
      },
    });
  } else {
    const existingByExternalUrl = await prisma.fileAndImage.findFirst({
      where: { file_url: trimmedUrl },
    });
    if (existingByExternalUrl) {
      fileRecord = await prisma.fileAndImage.update({
        where: { id: existingByExternalUrl.id },
        data: {
          file_name: uploadResult.fileName,
          file_url: uploadResult.fileUrl,
          folder_id: validFolderId ?? existingByExternalUrl.folder_id,
        },
        include: {
          folder: true,
          _count: { select: { galleries: true, page_fields: true } },
        },
      });
    } else {
      fileRecord = await prisma.fileAndImage.create({
        data: {
          file_name: uploadResult.fileName,
          file_url: uploadResult.fileUrl,
          folder_id: validFolderId,
        },
        include: {
          folder: true,
          _count: { select: { galleries: true, page_fields: true } },
        },
      });
    }
  }

  // Also update any BookingOptional referencing the old external URL
  await prisma.bookingOptional.updateMany({
    where: { image_url: trimmedUrl },
    data: { image_url: uploadResult.fileUrl },
  });

  return fileRecord;
}

/**
 * Synchronizes physical files in public/uploads with the database:
 * 1. Converts any external http/https records in DB into local physical files.
 * 2. Registers any physical subfolders not yet in media_folders.
 * 3. Uses DB as Source of Truth if a file in root was already moved to a folder in DB
 *    (moves physical root file to its DB folder or removes duplicate), preventing
 *    Git-committed files from re-appearing in root on rebuilds.
 * 4. Automatically registers any genuinely new physical files found on disk.
 */
let activeSyncPromise: Promise<void> | null = null;

export async function syncDiskMediaWithDb() {
  if (activeSyncPromise) {
    return activeSyncPromise;
  }
  activeSyncPromise = runSyncDiskMediaWithDb().finally(() => {
    activeSyncPromise = null;
  });
  return activeSyncPromise;
}

async function runSyncDiskMediaWithDb() {
  if ((process.env.STORAGE_PROVIDER || "local").toLowerCase() === "s3") {
    return;
  }

  const uploadDir =
    process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");

  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch {
    return;
  }

  // 1. Convert any external http/https files in DB into physical files
  const allDbFiles = await prisma.fileAndImage.findMany({
    orderBy: { created_date: "asc" },
    include: {
      folder: true,
      _count: { select: { galleries: true, page_fields: true } },
    },
  });

  // Deduplicate any DB rows that share the exact same file_url
  const seenUrls = new Map<string, string>();
  for (const dbFile of allDbFiles) {
    if (seenUrls.has(dbFile.file_url)) {
      const hasRelations =
        (dbFile._count?.galleries || 0) > 0 || (dbFile._count?.page_fields || 0) > 0;
      if (!hasRelations) {
        await prisma.fileAndImage.delete({ where: { id: dbFile.id } }).catch(() => {});
        continue;
      }
    } else {
      seenUrls.set(dbFile.file_url, dbFile.id);
    }

    if (/^https?:\/\//i.test(dbFile.file_url)) {
      try {
        await ensureLocalMediaFromUrl(
          dbFile.file_url,
          dbFile.folder_id,
          dbFile.id,
          dbFile.file_name
        );
      } catch (err) {
        console.warn("[cms-core] Failed to localize external image:", dbFile.file_url, err);
      }
    }
  }

  // Re-fetch DB folders and files after localization
  const existingFolders = await prisma.mediaFolder.findMany();
  const folderBySlug = new Map(existingFolders.map((f) => [f.slug, f]));

  // 2. Scan disk for subdirectories (level 1 and level 2) and ensure they exist in media_folders
  const rootEntries = await fs.readdir(uploadDir, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      const slug = generateFolderSlug(entry.name);
      let topFolder = folderBySlug.get(slug) || folderBySlug.get(entry.name);
      if (!topFolder) {
        try {
          topFolder = await prisma.mediaFolder.create({
            data: {
              name: entry.name,
              slug: entry.name,
              parent_id: null,
            },
          });
          folderBySlug.set(topFolder.slug, topFolder);
        } catch {
          // Ignore duplicate race condition
        }
      }

      // Scan level 2 subdirectories inside this top-level folder
      if (topFolder) {
        try {
          const level2Entries = await fs.readdir(path.join(uploadDir, entry.name), {
            withFileTypes: true,
          });
          for (const childEntry of level2Entries) {
            if (childEntry.isDirectory() && !childEntry.name.startsWith(".")) {
              const childSlug = `${topFolder.slug}/${childEntry.name}`;
              if (!folderBySlug.has(childSlug)) {
                try {
                  const createdChild = await prisma.mediaFolder.create({
                    data: {
                      name: childEntry.name,
                      slug: childSlug,
                      parent_id: topFolder.id,
                    },
                  });
                  folderBySlug.set(createdChild.slug, createdChild);
                } catch {
                  // Ignore duplicate race condition
                }
              }
            }
          }
        } catch {
          // Ignore read error
        }
      }
    }
  }

  const currentDbFiles = await prisma.fileAndImage.findMany({
    include: { folder: true },
  });
  const dbFileByName = new Map(currentDbFiles.map((f) => [f.file_name, f]));
  const dbFileByUrl = new Map(currentDbFiles.map((f) => [f.file_url, f]));

  const validExtensions = /\.(jpg|jpeg|png|webp|gif|svg|avif|pdf)$/i;

  // 3. Scan files in root uploadDir
  for (const entry of rootEntries) {
    if (!entry.isFile() || entry.name.startsWith(".") || !validExtensions.test(entry.name)) {
      continue;
    }

    const rootFilePath = path.join(uploadDir, entry.name);
    const rootFileUrl = `/uploads/${entry.name}`;
    const existingByName = dbFileByName.get(entry.name);

    if (existingByName) {
      // If DB says this file belongs in a subfolder (customer moved it!), enforce DB location
      if (existingByName.folder && existingByName.folder.slug) {
        const targetFolderDir = path.join(uploadDir, existingByName.folder.slug);
        const targetFilePath = path.join(targetFolderDir, entry.name);
        try {
          await fs.mkdir(targetFolderDir, { recursive: true });
          try {
            // Check if file already exists in target folder
            await fs.access(targetFilePath);
            // Already exists in target folder -> remove duplicate from root
            await fs.unlink(rootFilePath);
          } catch {
            // Not in target folder yet -> move from root to target folder
            await fs.rename(rootFilePath, targetFilePath);
          }
        } catch {
          // Ignore fs error
        }
      }
      continue;
    }

    if (!dbFileByUrl.has(rootFileUrl)) {
      try {
        const created = await prisma.fileAndImage.create({
          data: {
            file_name: entry.name,
            file_url: rootFileUrl,
            folder_id: null,
          },
          include: { folder: true },
        });
        dbFileByName.set(created.file_name, created);
        dbFileByUrl.set(created.file_url, created);
      } catch {
        // Ignore race condition
      }
    }
  }

  // 4. Scan files inside each subfolder (level 1 and level 2)
  for (const [slug, folder] of folderBySlug.entries()) {
    const folderDir = path.join(uploadDir, slug);
    let subEntries;
    try {
      subEntries = await fs.readdir(folderDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const subEntry of subEntries) {
      if (!subEntry.isFile() || subEntry.name.startsWith(".") || !validExtensions.test(subEntry.name)) {
        continue;
      }

      const subFileUrl = `/uploads/${slug}/${subEntry.name}`;
      if (!dbFileByUrl.has(subFileUrl) && !dbFileByName.has(subEntry.name)) {
        try {
          const created = await prisma.fileAndImage.create({
            data: {
              file_name: subEntry.name,
              file_url: subFileUrl,
              folder_id: folder.id,
            },
            include: { folder: true },
          });
          dbFileByName.set(created.file_name, created);
          dbFileByUrl.set(created.file_url, created);
        } catch {
          // Ignore race condition
        }
      }
    }
  }
}

export async function getMediaFoldersAction() {
  await syncDiskMediaWithDb();
  return prisma.mediaFolder.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          files: true,
          children: true,
        },
      },
    },
  });
}

export async function createMediaFolderAction(
  name: string,
  customSlug?: string,
  parentId?: string | null
) {
  const sanitized = generateFolderSlug((customSlug || name || "").trim());
  if (!sanitized) {
    throw new Error("Folder name is required");
  }

  let parentFolder: { id: string; slug: string; parent_id: string | null } | null = null;
  if (parentId) {
    parentFolder = await prisma.mediaFolder.findUnique({
      where: { id: parentId },
    });
    if (!parentFolder) {
      throw new Error("Parent folder not found");
    }
    if (parentFolder.parent_id) {
      throw new Error("Maximum folder depth is 2 levels");
    }
  }

  // Ensure unique folder name/slug
  let uniqueName = sanitized;
  let uniqueSlug = parentFolder ? `${parentFolder.slug}/${uniqueName}` : uniqueName;
  let counter = 1;
  while (await prisma.mediaFolder.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueName = `${sanitized}-${counter}`;
    uniqueSlug = parentFolder ? `${parentFolder.slug}/${uniqueName}` : uniqueName;
    counter++;
  }

  if ((process.env.STORAGE_PROVIDER || "local").toLowerCase() !== "s3") {
    const uploadDir =
      process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(path.join(uploadDir, uniqueSlug), { recursive: true });
  }

  const folder = await prisma.mediaFolder.create({
    data: {
      name: uniqueName,
      slug: uniqueSlug,
      parent_id: parentFolder ? parentFolder.id : null,
    },
    include: {
      _count: {
        select: {
          files: true,
          children: true,
        },
      },
    },
  });

  return folder;
}

export async function deleteMediaFolderAction(id: string) {
  const folder = await prisma.mediaFolder.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          files: true,
          children: true,
        },
      },
    },
  });

  if (!folder) {
    throw new Error("Folder not found");
  }

  if (folder._count.children > 0) {
    throw new Error("Cannot delete folder because it contains subfolders. Delete subfolders first.");
  }

  if (folder._count.files > 0) {
    throw new Error("Cannot delete folder because it contains files. Move all files before deleting.");
  }

  const storage = getStorageAdapter();
  await storage.deleteFolder(folder.slug);

  await prisma.mediaFolder.delete({
    where: { id },
  });

  return { success: true };
}

export async function getMediaFilesAction(folderId?: string | null) {
  await syncDiskMediaWithDb();

  const whereClause = folderId !== undefined ? { folder_id: folderId } : {};

  const [files, optionalsWithImages] = await Promise.all([
    prisma.fileAndImage.findMany({
      where: whereClause,
      orderBy: { created_date: "desc" },
      include: {
        folder: true,
        _count: {
          select: {
            galleries: true,
            page_fields: true,
          },
        },
      },
    }),
    prisma.bookingOptional.findMany({
      where: { image_url: { not: null } },
      select: { image_url: true },
    }),
  ]);

  const optionalImageUrls = new Set(
    optionalsWithImages.map((o) => o.image_url).filter(Boolean) as string[]
  );

  return files.map((file) => {
    const galleryCount = file._count?.galleries || 0;
    const pageFieldCount = file._count?.page_fields || 0;
    const optionalCount = optionalImageUrls.has(file.file_url) ? 1 : 0;
    const usageCount = galleryCount + pageFieldCount + optionalCount;

    return {
      ...file,
      is_used: usageCount > 0,
      usage_count: usageCount,
    };
  });
}

export async function uploadMediaAction(
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  mimeType?: string,
  folderId?: string | null
) {
  let folderSlug: string | null = null;
  let validFolderId: string | null = null;

  if (folderId) {
    const folder = await prisma.mediaFolder.findUnique({
      where: { id: folderId },
    });
    if (folder) {
      folderSlug = folder.slug;
      validFolderId = folder.id;
    }
  }

  const storage = getStorageAdapter();
  const uploadResult = await storage.upload(fileBuffer, fileName, mimeType, folderSlug);

  const fileRecord = await prisma.fileAndImage.create({
    data: {
      file_name: uploadResult.fileName,
      file_url: uploadResult.fileUrl,
      folder_id: validFolderId,
    },
    include: {
      folder: true,
      _count: {
        select: {
          galleries: true,
          page_fields: true,
        },
      },
    },
  });

  return {
    ...fileRecord,
    is_used: false,
    usage_count: 0,
  };
}

export async function moveMediaFileAction(fileId: string, targetFolderId: string | null) {
  const fileRecord = await prisma.fileAndImage.findUnique({
    where: { id: fileId },
    include: { folder: true },
  });

  if (!fileRecord) {
    throw new Error("File not found");
  }

  // If the file is an external URL, download it directly into the target folder
  if (/^https?:\/\//i.test(fileRecord.file_url)) {
    const localized = await ensureLocalMediaFromUrl(
      fileRecord.file_url,
      targetFolderId,
      fileRecord.id,
      fileRecord.file_name
    );
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/", "layout");
    } catch {
      // Ignore
    }
    return localized;
  }

  let targetFolderSlug: string | null = null;
  let validTargetFolderId: string | null = null;

  if (targetFolderId) {
    const targetFolder = await prisma.mediaFolder.findUnique({
      where: { id: targetFolderId },
    });
    if (!targetFolder) {
      throw new Error("Target folder not found");
    }
    targetFolderSlug = targetFolder.slug;
    validTargetFolderId = targetFolder.id;
  }

  const storage = getStorageAdapter();
  const moveResult = await storage.move(fileRecord.file_url, targetFolderSlug);

  const oldFileUrl = fileRecord.file_url;
  const newFileUrl = moveResult.newFileUrl;

  const updatedFile = await prisma.fileAndImage.update({
    where: { id: fileId },
    data: {
      file_url: newFileUrl,
      file_name: moveResult.newFileName || fileRecord.file_name,
      folder_id: validTargetFolderId,
    },
    include: {
      folder: true,
      _count: {
        select: {
          galleries: true,
          page_fields: true,
        },
      },
    },
  });

  // If any booking optionals point to old URL, update them
  if (oldFileUrl !== newFileUrl) {
    await prisma.bookingOptional.updateMany({
      where: { image_url: oldFileUrl },
      data: { image_url: newFileUrl },
    });
  }

  // Purge Next.js static cache
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/", "layout");
  } catch (err) {
    // Non-next execution context, ignore
  }

  return updatedFile;
}

export async function deleteMediaAction(id: string) {
  const fileRecord = await prisma.fileAndImage.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          galleries: true,
          page_fields: true,
        },
      },
    },
  });

  if (!fileRecord) {
    return false;
  }

  // Check if file is in use
  const optionalCount = await prisma.bookingOptional.count({
    where: { image_url: fileRecord.file_url },
  });

  const isUsed =
    (fileRecord._count?.galleries || 0) > 0 ||
    (fileRecord._count?.page_fields || 0) > 0 ||
    optionalCount > 0;

  if (isUsed) {
    throw new Error("Cannot delete file because it is in use on the website.");
  }

  const storage = getStorageAdapter();
  await storage.delete(fileRecord.file_url);

  await prisma.fileAndImage.delete({
    where: { id },
  });

  // Purge Next.js static cache
  try {
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/", "layout");
  } catch (err) {
    // Non-next execution context, ignore
  }

  return true;
}
