export interface SyncBookingItem {
  id: string;
  objectId: string;
  startDate: string;
  endDate: string;
  nightsCount: number;
  summary: string;
  sourceId: string;
  status: string;
  createdAt: string;
}

export interface SyncObjectResult {
  objectId: string;
  objectName: string;
  icalUrl: string | null;
  lastSynced: string | null;
  importedCount: number;
  totalEvents: number;
  cached: boolean;
  persistentFallback?: boolean;
  warning?: string;
  error?: string;
  bookings: SyncBookingItem[];
}

export interface SyncSummaryResult {
  totalObjects: number;
  activeFeedsCount: number;
  totalImportedBookings: number;
  lastSynced: string;
  results: SyncObjectResult[];
}

