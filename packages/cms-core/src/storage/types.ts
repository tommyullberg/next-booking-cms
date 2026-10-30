export interface StorageResult {
  fileUrl: string;
  fileName: string;
  size: number;
}

export interface StorageAdapter {
  upload(
    file: Buffer | Uint8Array,
    fileName: string,
    mimeType?: string,
    folderSlug?: string | null
  ): Promise<StorageResult>;

  delete(fileUrl: string): Promise<boolean>;

  getUrl(fileName: string, folderSlug?: string | null): string;

  move(
    fileUrl: string,
    targetFolderSlug: string | null
  ): Promise<{ newFileUrl: string; newFileName: string }>;

  deleteFolder(folderSlug: string): Promise<boolean>;
}
