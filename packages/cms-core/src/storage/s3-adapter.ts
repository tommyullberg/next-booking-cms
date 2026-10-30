import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import path from "path";
import { StorageAdapter, StorageResult } from "./types";

export interface S3AdapterConfig {
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  forcePathStyle?: boolean;
  publicUrlPrefix?: string;
}

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;
  private endpoint?: string;
  private publicUrlPrefix?: string;

  constructor(config?: S3AdapterConfig) {
    this.bucket =
      config?.bucketName ?? process.env.S3_BUCKET_NAME ?? "nextbooking-media";
    this.endpoint = config?.endpoint ?? process.env.S3_ENDPOINT;
    this.publicUrlPrefix =
      config?.publicUrlPrefix ?? process.env.S3_PUBLIC_URL_PREFIX;

    const region = config?.region ?? process.env.S3_REGION ?? "us-east-1";
    const accessKeyId =
      config?.accessKeyId ?? process.env.S3_ACCESS_KEY_ID ?? "minioadmin";
    const secretAccessKey =
      config?.secretAccessKey ??
      process.env.S3_SECRET_ACCESS_KEY ??
      "minioadmin_secret";

    this.client = new S3Client({
      region,
      endpoint: this.endpoint,
      forcePathStyle:
        config?.forcePathStyle ??
        (this.endpoint ? this.endpoint.includes("localhost") || this.endpoint.includes("127.0.0.1") : false),
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  private getKeyFromUrl(fileUrl: string): string {
    if (this.publicUrlPrefix && fileUrl.startsWith(this.publicUrlPrefix)) {
      return fileUrl.slice(this.publicUrlPrefix.length).replace(/^\/+/, "");
    }
    try {
      const url = new URL(fileUrl);
      const pathname = url.pathname.replace(/^\/+/, "");
      if (this.endpoint && pathname.startsWith(this.bucket + "/")) {
        return pathname.slice(this.bucket.length + 1);
      }
      return pathname;
    } catch {
      return fileUrl.replace(/^\/+/, "");
    }
  }

  async upload(
    file: Buffer | Uint8Array,
    fileName: string,
    mimeType?: string,
    folderSlug?: string | null
  ): Promise<StorageResult> {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueKey = folderSlug
      ? `${folderSlug}/${Date.now()}-${sanitizedName}`
      : `${Date.now()}-${sanitizedName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: uniqueKey,
        Body: file,
        ContentType: mimeType || "application/octet-stream",
      })
    );

    const fileUrl = this.getUrl(uniqueKey);
    return {
      fileUrl,
      fileName: path.basename(uniqueKey),
      size: file.length,
    };
  }

  async delete(fileUrl: string): Promise<boolean> {
    try {
      const key = this.getKeyFromUrl(fileUrl);
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  getUrl(fileNameOrKey: string, folderSlug?: string | null): string {
    const key = folderSlug ? `${folderSlug}/${fileNameOrKey}` : fileNameOrKey;
    if (this.publicUrlPrefix) {
      return `${this.publicUrlPrefix.replace(/\/$/, "")}/${key}`;
    }
    if (this.endpoint) {
      return `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  async move(
    fileUrl: string,
    targetFolderSlug: string | null
  ): Promise<{ newFileUrl: string; newFileName: string }> {
    const oldKey = this.getKeyFromUrl(fileUrl);
    const fileName = path.basename(oldKey);
    const newKey = targetFolderSlug ? `${targetFolderSlug}/${fileName}` : fileName;

    if (oldKey !== newKey) {
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${oldKey}`,
          Key: newKey,
        })
      );
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: oldKey,
        })
      );
    }

    const newFileUrl = this.getUrl(newKey);
    return {
      newFileUrl,
      newFileName: fileName,
    };
  }

  async deleteFolder(_folderSlug: string): Promise<boolean> {
    // S3 directories are virtual prefixes, no explicit folder deletion is required
    return true;
  }
}
