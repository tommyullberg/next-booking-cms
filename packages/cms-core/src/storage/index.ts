import { LocalStorageAdapter } from "./local-adapter";
import { S3StorageAdapter, S3AdapterConfig } from "./s3-adapter";
import { StorageAdapter } from "./types";

export * from "./types";
export * from "./local-adapter";
export * from "./s3-adapter";

let cachedAdapter: StorageAdapter | null = null;

export function getStorageAdapter(
  overrideProvider?: "local" | "s3",
  s3Config?: S3AdapterConfig
): StorageAdapter {
  if (cachedAdapter && !overrideProvider && !s3Config) {
    return cachedAdapter;
  }

  const provider =
    overrideProvider ?? process.env.STORAGE_PROVIDER ?? "local";

  let adapter: StorageAdapter;
  if (provider === "s3") {
    adapter = new S3StorageAdapter(s3Config);
  } else {
    adapter = new LocalStorageAdapter();
  }

  if (!overrideProvider && !s3Config) {
    cachedAdapter = adapter;
  }

  return adapter;
}
