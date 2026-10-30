import fs from "fs/promises";
import path from "path";
import { StorageAdapter, StorageResult } from "./types";

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;
  private urlPrefix: string;

  constructor(uploadDir?: string, urlPrefix: string = "/uploads") {
    this.uploadDir =
      uploadDir ??
      process.env.LOCAL_UPLOAD_DIR ??
      path.join(process.cwd(), "public", "uploads");
    this.urlPrefix = urlPrefix;
  }

  private getFilePathFromUrl(fileUrl: string): string {
    const cleanUrl = fileUrl.startsWith(this.urlPrefix)
      ? fileUrl.slice(this.urlPrefix.length).replace(/^\/+/, "")
      : fileUrl.replace(/^\/+/, "");
    return path.join(this.uploadDir, cleanUrl);
  }

  async upload(
    file: Buffer | Uint8Array,
    fileName: string,
    _mimeType?: string,
    folderSlug?: string | null
  ): Promise<StorageResult> {
    const targetDir = folderSlug
      ? path.join(this.uploadDir, folderSlug)
      : this.uploadDir;

    await fs.mkdir(targetDir, { recursive: true });

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(targetDir, uniqueName);

    await fs.writeFile(filePath, file);

    const fileUrl = folderSlug
      ? `${this.urlPrefix}/${folderSlug}/${uniqueName}`
      : `${this.urlPrefix}/${uniqueName}`;

    return {
      fileUrl,
      fileName: uniqueName,
      size: file.length,
    };
  }

  async delete(fileUrl: string): Promise<boolean> {
    try {
      const filePath = this.getFilePathFromUrl(fileUrl);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(fileName: string, folderSlug?: string | null): string {
    return folderSlug
      ? `${this.urlPrefix}/${folderSlug}/${fileName}`
      : `${this.urlPrefix}/${fileName}`;
  }

  async move(
    fileUrl: string,
    targetFolderSlug: string | null
  ): Promise<{ newFileUrl: string; newFileName: string }> {
    if (/^https?:\/\//i.test(fileUrl)) {
      return {
        newFileUrl: fileUrl,
        newFileName: "",
      };
    }

    const currentFilePath = this.getFilePathFromUrl(fileUrl);
    const fileName = path.basename(currentFilePath);

    const targetDir = targetFolderSlug
      ? path.join(this.uploadDir, targetFolderSlug)
      : this.uploadDir;

    await fs.mkdir(targetDir, { recursive: true });
    const targetFilePath = path.join(targetDir, fileName);

    let sourcePath = currentFilePath;
    try {
      await fs.access(sourcePath);
    } catch {
      const rootFallbackPath = path.join(this.uploadDir, fileName);
      try {
        await fs.access(rootFallbackPath);
        sourcePath = rootFallbackPath;
      } catch {
        try {
          await fs.access(targetFilePath);
          sourcePath = targetFilePath;
        } catch {
          throw new Error(`Physical file "${fileName}" was not found on disk.`);
        }
      }
    }

    if (sourcePath !== targetFilePath) {
      await fs.rename(sourcePath, targetFilePath);
    }

    const newFileUrl = targetFolderSlug
      ? `${this.urlPrefix}/${targetFolderSlug}/${fileName}`
      : `${this.urlPrefix}/${fileName}`;

    return {
      newFileUrl,
      newFileName: fileName,
    };
  }

  async deleteFolder(folderSlug: string): Promise<boolean> {
    try {
      const folderPath = path.join(this.uploadDir, folderSlug);
      await fs.rmdir(folderPath);
      return true;
    } catch {
      return false;
    }
  }
}
