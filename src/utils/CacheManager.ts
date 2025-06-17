export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version?: string; // For cache invalidation
}

export interface CacheConfig {
  defaultTTL: number;
  maxMemoryEntries: number;
  persistToLocalStorage: boolean;
  versionKey?: string;
}

export class CacheManager {
  private static instance: CacheManager;
  private memoryCache = new Map<string, CacheEntry>();
  private config: CacheConfig;

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxMemoryEntries: 100,
      persistToLocalStorage: true,
      ...config,
    };
  }

  static getInstance(config?: Partial<CacheConfig>): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  /**
   * Get data from cache (memory first, then localStorage)
   */
  get<T>(key: string): T | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      console.log(`🎯 Cache HIT (memory): ${key}`);
      return memoryEntry.data as T;
    }

    // Check localStorage if enabled
    if (this.config.persistToLocalStorage) {
      const localEntry = this.getFromLocalStorage<T>(key);
      if (localEntry && this.isValid(localEntry)) {
        console.log(`🎯 Cache HIT (localStorage): ${key}`);
        // Promote to memory cache
        this.memoryCache.set(key, localEntry);
        return localEntry.data as T;
      }
    }

    console.log(`❌ Cache MISS: ${key}`);
    return null;
  }

  /**
   * Set data in cache (memory and localStorage)
   */
  set<T>(key: string, data: T, ttl: number = this.config.defaultTTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.config.versionKey,
    };

    // Set in memory cache
    this.memoryCache.set(key, entry);
    console.log(`💾 Cache SET (memory): ${key} [TTL: ${ttl}ms]`);

    // Enforce memory limit
    if (this.memoryCache.size > this.config.maxMemoryEntries) {
      this.evictOldestMemoryEntry();
    }

    // Set in localStorage if enabled
    if (this.config.persistToLocalStorage) {
      this.setToLocalStorage(key, entry);
      console.log(`💾 Cache SET (localStorage): ${key}`);
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.memoryCache.delete(key);

    if (this.config.persistToLocalStorage) {
      try {
        localStorage.removeItem(`kidquest_cache_${key}`);
      } catch (error) {
        console.warn("LocalStorage removeItem failed:", error);
      }
    }

    console.log(`🗑️ Cache INVALIDATED: ${key}`);
  }

  /**
   * Invalidate all cache entries with a given prefix
   */
  invalidateByPrefix(prefix: string): void {
    // Invalidate memory cache
    const memoryKeysToDelete: string[] = [];
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryKeysToDelete.push(key);
      }
    }
    memoryKeysToDelete.forEach((key) => this.memoryCache.delete(key));

    // Invalidate localStorage
    if (this.config.persistToLocalStorage) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (
            key.startsWith("kidquest_cache_") &&
            key.substring("kidquest_cache_".length).startsWith(prefix)
          ) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn("LocalStorage invalidateByPrefix failed:", error);
      }
    }

    console.log(`🗑️ Cache INVALIDATED by prefix: ${prefix}`);
  }

  /**
   * Clear all cache data
   */
  clear(): void {
    this.memoryCache.clear();

    if (this.config.persistToLocalStorage) {
      try {
        // Clear all KidQuest cache entries from localStorage
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith("kidquest_cache_")) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn("LocalStorage clear failed:", error);
      }
    }

    console.log("🧹 Cache CLEARED completely");
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memoryEntries: number;
    localStorageEntries: number;
    hitRate: number;
    memoryUsage: string;
  } {
    let localStorageEntries = 0;

    if (this.config.persistToLocalStorage) {
      try {
        const keys = Object.keys(localStorage);
        localStorageEntries = keys.filter((key) =>
          key.startsWith("kidquest_cache_")
        ).length;
      } catch (error) {
        console.warn("LocalStorage access failed:", error);
      }
    }

    return {
      memoryEntries: this.memoryCache.size,
      localStorageEntries,
      hitRate: 0, // TODO: Implement hit rate tracking
      memoryUsage: this.getMemoryUsageEstimate(),
    };
  }

  /**
   * Clean expired entries from both caches
   */
  cleanup(): void {
    let removedCount = 0;

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (!this.isValid(entry)) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }

    // Clean localStorage cache
    if (this.config.persistToLocalStorage) {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith("kidquest_cache_")) {
            const rawData = localStorage.getItem(key);
            if (rawData) {
              try {
                const entry = JSON.parse(rawData) as CacheEntry;
                if (!this.isValid(entry)) {
                  localStorage.removeItem(key);
                  removedCount++;
                }
              } catch (error) {
                // Invalid data, remove it
                localStorage.removeItem(key);
                removedCount++;
              }
            }
          }
        });
      } catch (error) {
        console.warn("LocalStorage cleanup failed:", error);
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cache CLEANUP: Removed ${removedCount} expired entries`);
    }
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;
    const isVersionMismatch =
      this.config.versionKey && entry.version !== this.config.versionKey;

    return !isExpired && !isVersionMismatch;
  }

  /**
   * Get entry from localStorage
   */
  private getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
    try {
      const rawData = localStorage.getItem(`kidquest_cache_${key}`);
      if (!rawData) return null;

      return JSON.parse(rawData) as CacheEntry<T>;
    } catch (error) {
      console.warn("LocalStorage getItem failed:", error);
      return null;
    }
  }

  /**
   * Set entry to localStorage
   */
  private setToLocalStorage<T>(key: string, entry: CacheEntry<T>): void {
    try {
      localStorage.setItem(`kidquest_cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      if (error instanceof Error && error.name === "QuotaExceededError") {
        console.warn("LocalStorage quota exceeded, clearing old cache");
        this.clearOldLocalStorageEntries();
        // Try again
        try {
          localStorage.setItem(`kidquest_cache_${key}`, JSON.stringify(entry));
        } catch (retryError) {
          console.warn("LocalStorage setItem failed on retry:", retryError);
        }
      } else {
        console.warn("LocalStorage setItem failed:", error);
      }
    }
  }

  /**
   * Evict oldest entry from memory cache
   */
  private evictOldestMemoryEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      console.log(`🗑️ Cache EVICTED (memory full): ${oldestKey}`);
    }
  }

  /**
   * Clear old entries from localStorage when quota exceeded
   */
  private clearOldLocalStorageEntries(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter((key) => key.startsWith("kidquest_cache_"));

      // Sort by timestamp (oldest first)
      const entriesWithTimestamp: { key: string; timestamp: number }[] = [];

      cacheKeys.forEach((key) => {
        try {
          const rawData = localStorage.getItem(key);
          if (rawData) {
            const entry = JSON.parse(rawData) as CacheEntry;
            entriesWithTimestamp.push({ key, timestamp: entry.timestamp });
          }
        } catch (error) {
          // Remove invalid entries
          localStorage.removeItem(key);
        }
      });

      entriesWithTimestamp.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest 50% of entries
      const toRemove = Math.ceil(entriesWithTimestamp.length * 0.5);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(entriesWithTimestamp[i].key);
      }

      console.log(`🧹 LocalStorage CLEANUP: Removed ${toRemove} old entries`);
    } catch (error) {
      console.warn("LocalStorage cleanup failed:", error);
    }
  }

  /**
   * Estimate memory usage of cache
   */
  private getMemoryUsageEstimate(): string {
    let totalSize = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      // Rough estimate: key + JSON stringified data
      totalSize += key.length * 2; // Unicode characters are 2 bytes
      totalSize += JSON.stringify(entry).length * 2;
    }

    if (totalSize < 1024) {
      return `${totalSize} bytes`;
    } else if (totalSize < 1024 * 1024) {
      return `${(totalSize / 1024).toFixed(1)} KB`;
    } else {
      return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
    }
  }
}

// Cache configurations for different data types
export const CacheConfigs = {
  // Short-lived data (5 minutes)
  REALTIME: { defaultTTL: 5 * 60 * 1000, persistToLocalStorage: false },

  // Medium-lived data (30 minutes)
  DYNAMIC: { defaultTTL: 30 * 60 * 1000, persistToLocalStorage: true },

  // Long-lived data (24 hours)
  STATIC: { defaultTTL: 24 * 60 * 60 * 1000, persistToLocalStorage: true },

  // User session data (until logout)
  SESSION: { defaultTTL: 24 * 60 * 60 * 1000, persistToLocalStorage: true },
} as const;

// Singleton instances for different cache types
export const realtimeCache = CacheManager.getInstance(CacheConfigs.REALTIME);
export const dynamicCache = CacheManager.getInstance(CacheConfigs.DYNAMIC);
export const staticCache = CacheManager.getInstance(CacheConfigs.STATIC);
export const sessionCache = CacheManager.getInstance(CacheConfigs.SESSION);

// Global cache cleanup interval (runs every 10 minutes)
if (typeof window !== "undefined") {
  setInterval(() => {
    realtimeCache.cleanup();
    dynamicCache.cleanup();
    staticCache.cleanup();
    sessionCache.cleanup();
  }, 10 * 60 * 1000);
}
