// Client-side caching utilities for improved performance
import { supabase } from './supabase'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes

  // Generic cache get/set methods
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Cache with automatic fetching
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetchFn()
    this.set(key, data, ttl)
    return data
  }

  // Get cache statistics
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0
    let totalSize = 0

    for (const [key, entry] of this.cache.entries()) {
      totalSize += JSON.stringify(entry).length
      if (now <= entry.timestamp + entry.ttl) {
        validEntries++
      } else {
        expiredEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      totalSize,
      hitRate: this.hitCount / Math.max(this.requestCount, 1)
    }
  }

  private hitCount = 0
  private requestCount = 0

  // Override get method to track hit rate
  getWithStats<T>(key: string): T | null {
    this.requestCount++
    const result = this.get<T>(key)
    if (result !== null) {
      this.hitCount++
    }
    return result
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
export const cache = new CacheManager()

// Automatic cleanup every 10 minutes
setInterval(() => {
  cache.cleanup()
}, 10 * 60 * 1000)

// Cached query functions
export class CachedQueries {
  // Cache jobs with different TTLs based on data type
  static async getJobs(filters?: any) {
    const cacheKey = `jobs:${JSON.stringify(filters || {})}`
    return cache.getOrFetch(
      cacheKey,
      async () => {
        const { data } = await supabase
          .rpc('search_jobs_optimized', {
            search_keywords: filters?.keywords,
            job_types: filters?.job_types,
            min_salary: filters?.salary_min,
            max_salary: filters?.salary_max,
            location_filter: filters?.location,
            skills_filter: filters?.skills,
            limit_count: filters?.limit || 20,
            offset_count: filters?.offset || 0
          } as any)
        return data || []
      },
      2 * 60 * 1000 // 2 minutes for job listings
    )
  }

  // Cache user profile with longer TTL
  static async getUserProfile(userId: string) {
    const cacheKey = `user_profile:${userId}`
    return cache.getOrFetch(
      cacheKey,
      async () => {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        return data
      },
      10 * 60 * 1000 // 10 minutes for profiles
    )
  }

  // Cache company profile
  static async getCompanyProfile(userId: string) {
    const cacheKey = `company_profile:${userId}`
    return cache.getOrFetch(
      cacheKey,
      async () => {
        const { data } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        return data
      },
      10 * 60 * 1000 // 10 minutes for profiles
    )
  }

  // Cache job recommendations
  static async getJobRecommendations(userId: string, limit: number = 10) {
    const cacheKey = `recommendations:${userId}:${limit}`
    return cache.getOrFetch(
      cacheKey,
      async () => {
        const { data } = await supabase
          .rpc('get_job_matches_optimized', {
            user_uuid: userId,
            limit_count: limit
          } as any)
        return data || []
      },
      5 * 60 * 1000 // 5 minutes for recommendations
    )
  }

  // Cache events with location-based TTL
  static async getEvents(filters?: any) {
    const cacheKey = `events:${JSON.stringify(filters || {})}`
    return cache.getOrFetch(
      cacheKey,
      async () => {
        let query = supabase
          .from('events')
          .select(`
            *,
            company_profiles:company_id (
              company_name,
              location
            )
          `)
          .eq('status', 'published')
          .gte('end_date', new Date().toISOString())

        if (filters?.event_type) {
          query = query.eq('event_type', filters.event_type)
        }
        if (filters?.is_online !== undefined) {
          query = query.eq('is_online', filters.is_online)
        }
        if (filters?.tags?.length > 0) {
          query = query.overlaps('tags', filters.tags)
        }
        if (filters?.date_from) {
          query = query.gte('start_date', filters.date_from)
        }
        if (filters?.date_to) {
          query = query.lte('start_date', filters.date_to)
        }

        const { data } = await query
          .order('start_date', { ascending: true })
          .limit(filters?.limit || 50)

        return data || []
      },
      3 * 60 * 1000 // 3 minutes for events
    )
  }

  // Cache user files
  static async getUserFiles(userId: string, uploadType?: string) {
    const cacheKey = `user_files:${userId}:${uploadType || 'all'}`
    return cache.getOrFetch(
      cacheKey,
      async () => {
        let query = supabase
          .from('user_files')
          .select('*')
          .eq('user_id', userId)

        if (uploadType) {
          query = query.eq('upload_type', uploadType)
        }

        const { data } = await query.order('created_at', { ascending: false })
        return data || []
      },
      15 * 60 * 1000 // 15 minutes for file lists
    )
  }

  // Cache rating summaries
  static async getUserRatingSummary(userId: string) {
    const cacheKey = `rating_summary:${userId}`
    return cache.getOrFetch(
      cacheKey,
      async () => {
        const { data } = await supabase
          .from('user_ratings_summary')
          .select('*')
          .eq('user_id', userId)
        return data || []
      },
      30 * 60 * 1000 // 30 minutes for ratings (less frequently updated)
    )
  }

  // Invalidate related caches
  static invalidateUserCaches(userId: string) {
    const patterns = [
      `user_profile:${userId}`,
      `company_profile:${userId}`,
      `recommendations:${userId}`,
      `user_files:${userId}`,
      `rating_summary:${userId}`
    ]

    patterns.forEach(pattern => {
      cache.delete(pattern)
      // Also clear partial matches
      for (const key of cache['cache'].keys()) {
        if (key.startsWith(pattern)) {
          cache.delete(key)
        }
      }
    })
  }

  // Invalidate job-related caches
  static invalidateJobCaches() {
    for (const key of cache['cache'].keys()) {
      if (key.startsWith('jobs:') || key.startsWith('recommendations:')) {
        cache.delete(key)
      }
    }
  }

  // Invalidate event caches
  static invalidateEventCaches() {
    for (const key of cache['cache'].keys()) {
      if (key.startsWith('events:')) {
        cache.delete(key)
      }
    }
  }
}

// Browser storage cache for persistence across sessions
export class PersistentCache {
  private static readonly prefix = 'jobai_cache_'
  private static readonly maxAge = 24 * 60 * 60 * 1000 // 24 hours

  static get<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(this.prefix + key)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      if (Date.now() > parsed.timestamp + parsed.ttl) {
        this.delete(key)
        return null
      }

      return parsed.data as T
    } catch {
      return null
    }
  }

  static set<T>(key: string, data: T, ttl: number = this.maxAge): void {
    try {
      const entry = {
        data,
        timestamp: Date.now(),
        ttl
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(entry))
    } catch {
      // Storage might be full or disabled
    }
  }

  static delete(key: string): void {
    localStorage.removeItem(this.prefix + key)
  }

  static clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  // Clean up expired entries
  static cleanup(): void {
    const keys = Object.keys(localStorage)
    const now = Date.now()

    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const parsed = JSON.parse(stored)
            if (now > parsed.timestamp + parsed.ttl) {
              localStorage.removeItem(key)
            }
          }
        } catch {
          // Remove corrupted entries
          localStorage.removeItem(key)
        }
      }
    })
  }
}

// Cleanup persistent cache on app start
PersistentCache.cleanup()

// Performance monitoring
export const CacheMetrics = {
  getMemoryUsage: () => cache.getStats(),
  getStorageUsage: () => {
    try {
      const keys = Object.keys(localStorage)
      let totalSize = 0
      let cacheEntries = 0

      keys.forEach(key => {
        if (key.startsWith(PersistentCache['prefix'])) {
          totalSize += localStorage.getItem(key)?.length || 0
          cacheEntries++
        }
      })

      return { totalSize, cacheEntries }
    } catch {
      return { totalSize: 0, cacheEntries: 0 }
    }
  },

  clearAllCaches: () => {
    cache.clear()
    PersistentCache.clear()
  }
}