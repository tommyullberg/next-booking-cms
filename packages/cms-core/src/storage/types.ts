export interface StorageResult {
  fileUrl: string;
  fileName: string;
  size: number;
}

export interface StorageAdapter {
  upload(
    file: Buffer | Uint8Array,
    fileName: string,
    mimeType?: string
  ): Promise<StorageResult>;

  delete(fileUrl: string): Promise<boolean>;

  getUrl(fileName: string): string;
}
