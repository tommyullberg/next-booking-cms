import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import path from "node:path";
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

  async upload(
    file: Buffer | Uint8Array,
    fileName: string,
    mimeType?: string
  ): Promise<StorageResult> {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueKey = `${Date.now()}-${sanitizedName}`;

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
      fileName: uniqueKey,
      size: file.length,
    };
  }

  async delete(fileUrl: string): Promise<boolean> {
    try {
      const key = path.basename(fileUrl);
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

  getUrl(fileName: string): string {
    if (this.publicUrlPrefix) {
      return `${this.publicUrlPrefix.replace(/\/$/, "")}/${fileName}`;
    }
    if (this.endpoint) {
      return `${this.endpoint.replace(/\/$/, "")}/${this.bucket}/${fileName}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${fileName}`;
  }
}
