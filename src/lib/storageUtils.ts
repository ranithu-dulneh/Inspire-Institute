/**
 * Safe LocalStorage Utilities
 * Protects against QuotaExceededError by preventing storage of base64 blobs,
 * auto-purging bloated legacy keys, and handling quota errors gracefully.
 */

export function cleanLocalStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // 1. Purge massive base64 teacher cutout if stored locally
    const cutout = localStorage.getItem('inspire_teacher_photo_cutout');
    if (cutout && cutout.startsWith('data:image/')) {
      console.info('Storage Sanitizer: Removing legacy bloated teacher photo from localStorage');
      localStorage.removeItem('inspire_teacher_photo_cutout');
    }

    // 2. Sanitize inspire_categorized_materials: strip any base64 fileUrls
    const rawMaterials = localStorage.getItem('inspire_categorized_materials');
    if (rawMaterials) {
      try {
        const parsed = JSON.parse(rawMaterials);
        if (Array.isArray(parsed)) {
          let modified = false;
          const cleaned = parsed.map((item: any) => {
            if (item.fileUrl && typeof item.fileUrl === 'string' && item.fileUrl.startsWith('data:')) {
              modified = true;
              return { ...item, fileUrl: '' };
            }
            return item;
          });

          if (modified) {
            console.info('Storage Sanitizer: Purged base64 payloads from categorized materials');
            localStorage.setItem('inspire_categorized_materials', JSON.stringify(cleaned));
          }
        }
      } catch {
        localStorage.removeItem('inspire_categorized_materials');
      }
    }

    // 3. Scan all localStorage keys for oversized entries (> 500KB)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      try {
        const val = localStorage.getItem(key);
        if (val && val.length > 500 * 1024) {
          // If oversized and contains data: URI, remove it
          if (val.includes('data:')) {
            console.warn(`Storage Sanitizer: Removing oversized key ${key} (${Math.round(val.length / 1024)} KB)`);
            localStorage.removeItem(key);
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('Storage Sanitizer non-fatal notice:', err);
  }
}

/**
 * Safely set a key in localStorage with quota overflow recovery
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  // Never allow storing massive base64 blobs into localStorage
  if (value.length > 1024 * 1024 && value.includes('data:')) {
    console.warn(`Blocked saving oversized base64 blob to localStorage key: ${key}`);
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuotaError = 
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      String(err?.message).includes('exceeded the quota');

    if (isQuotaError) {
      console.warn(`Quota exceeded writing key "${key}". Running storage cleanup...`);
      cleanLocalStorage();

      // Retry once after cleanup
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.warn(`Could not set localStorage key "${key}" even after cleanup:`, retryErr);
        return false;
      }
    }

    console.warn(`localStorage setItem failed for key "${key}":`, err);
    return false;
  }
}

/**
 * Safely get and parse JSON from localStorage
 */
export function safeLocalStorageGet<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return defaultValue;

  try {
    const val = localStorage.getItem(key);
    if (!val) return defaultValue;
    return JSON.parse(val) as T;
  } catch {
    return defaultValue;
  }
}

// Auto-run sanitation on import
if (typeof window !== 'undefined') {
  cleanLocalStorage();
}
