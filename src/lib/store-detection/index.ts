export interface StoreInfo {
  id: string
  name: string
  url: string
  platform?: string
}

export async function detectStoreFromUrl(url: string): Promise<StoreInfo | null> {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname

    // Extract store identifier from URL
    const storeId = hostname.split('.')[0]

    return {
      id: storeId,
      name: storeId,
      url: url,
      platform: 'zid',
    }
  } catch {
    return null
  }
}

export function isValidStoreUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function normalizeStoreUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return `${urlObj.protocol}//${urlObj.hostname}`
  } catch {
    return url
  }
}
