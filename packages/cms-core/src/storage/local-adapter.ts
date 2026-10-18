import fs from "node:fs/promises";
import path from "node:path";
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

  async upload(
    file: Buffer | Uint8Array,
    fileName: string,
    _mimeType?: string
  ): Promise<StorageResult> {
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Clean up filename and make unique if collision
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(this.uploadDir, uniqueName);

    await fs.writeFile(filePath, file);

    const fileUrl = `${this.urlPrefix}/${uniqueName}`;
    return {
      fileUrl,
      fileName: uniqueName,
      size: file.length,
    };
  }

  async delete(fileUrl: string): Promise<boolean> {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getUrl(fileName: string): string {
    return `${this.urlPrefix}/${fileName}`;
  }
}
