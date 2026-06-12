export function isOfflineMode(online: boolean, apiReachable: boolean): boolean {
  return !online || !apiReachable
}
