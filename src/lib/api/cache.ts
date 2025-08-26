import { LRUCache } from 'lru-cache';

interface CacheOptions {
  ttl?: number;
  max?: number;
}

class APICache {
  private cache: LRUCache<string, any>;

  constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache({
      max: options.max || 100,
      ttl: options.ttl || 1000 * 60 * 5, // 5 minutes default
    });
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.cache.get(key);
    if (cached) return cached;

    const data = await fetcher();
    this.cache.set(key, data, { ttl });
    return data;
  }

  invalidate(pattern?: string) {
    if (pattern) {
      const keys = [...this.cache.keys()];
      keys.forEach(key => {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }
}

export const apiCache = new APICache();