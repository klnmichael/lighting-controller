export const APINATOR_CHANNEL = "private-lighting";

export interface SyncRequest {
  id: string;
  clientTime: number;
}

export function isSyncRequest(value: unknown): value is SyncRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Record<string, unknown>;
  return typeof request.id === "string" &&
    /^[a-zA-Z0-9-]{1,80}$/.test(request.id) &&
    typeof request.clientTime === "number" && Number.isFinite(request.clientTime);
}
