// Performance monitoring and optimization utilities

interface PerformanceMetrics {
  operation: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private maxMetrics = 1000

  // Start timing an operation
  startTiming(operation: string): { end: (metadata?: Record<string, any>) => number } {
    const startTime = performance.now()
    const timestamp = Date.now()

    return {
      end: (metadata?: Record<string, any>) => {
        const duration = performance.now() - startTime
        this.recordMetric({
          operation,
          duration,
          timestamp,
          metadata
        })
        return duration
      }
    }
  }

  // Record a metric
  private recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric)

    // Keep only recent metrics to prevent memory issues
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  // Get performance statistics
  getStats(operation?: string) {
    const filteredMetrics = operation
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics

    if (filteredMetrics.length === 0) {
      return null
    }

    const durations = filteredMetrics.map(m => m.duration)
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)

    // Calculate percentiles
    const sorted = [...durations].sort((a, b) => a - b)
    const p50 = sorted[Math.floor(sorted.length * 0.5)]
    const p90 = sorted[Math.floor(sorted.length * 0.9)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    return {
      operation: operation || 'all',
      count: filteredMetrics.length,
      avg,
      min,
      max,
      p50,
      p90,
      p95,
      p99,
      recent: filteredMetrics.slice(-10) // Last 10 operations
    }
  }

  // Get slow operations (above threshold)
  getSlowOperations(thresholdMs: number = 1000) {
    return this.metrics
      .filter(m => m.duration > thresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 50) // Top 50 slow operations
  }

  // Clear metrics
  clear() {
    this.metrics = []
  }

  // Export metrics for analysis
  exportMetrics() {
    return {
      metrics: this.metrics,
      summary: this.getStats(),
      slowOperations: this.getSlowOperations()
    }
  }
}

// Global performance monitor
export const perfMonitor = new PerformanceMonitor()

// Performance decorator for functions
export function withPerfTracking<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T {
  return ((...args: any[]) => {
    const timer = perfMonitor.startTiming(operationName)

    try {
      const result = fn(...args)

      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          timer.end({ args: args.length, async: true })
        })
      } else {
        timer.end({ args: args.length, async: false })
        return result
      }
    } catch (error) {
      timer.end({ args: args.length, error: true })
      throw error
    }
  }) as T
}

// Image optimization utilities
export class ImageOptimizer {
  // Convert image to WebP format if supported
  static async convertToWebP(file: File): Promise<File | null> {
    if (!HTMLCanvasElement.prototype.toBlob) {
      return null // Browser doesn't support canvas toBlob
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
              type: 'image/webp'
            })
            resolve(webpFile)
          } else {
            resolve(null)
          }
        }, 'image/webp', 0.8)
      }

      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(file)
    })
  }

  // Resize image for optimization
  static async resizeImage(file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        // Use better image rendering
        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: file.type
            })
            resolve(optimizedFile)
          } else {
            reject(new Error('Failed to optimize image'))
          }
        }, file.type, quality)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }
}

// Debounce utility for search optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout | null = null

  return ((...args: any[]) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }) as T
}

// Throttle utility for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean = false

  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }) as T
}

// Lazy loading utility
export function createIntersectionObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }

  return new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry)
      }
    })
  }, defaultOptions)
}

// Bundle size optimization - code splitting helpers
export async function loadComponent<T>(
  importFn: () => Promise<{ default: T }>
): Promise<T> {
  const timer = perfMonitor.startTiming('dynamic_import')

  try {
    const module = await importFn()
    timer.end({ success: true })
    return module.default
  } catch (error) {
    timer.end({ success: false })
    throw error
  }
}

// Memory usage monitoring
export class MemoryMonitor {
  static getMemoryInfo() {
    // @ts-ignore - performance.memory is Chrome-specific
    const memory = (performance as any).memory

    if (memory) {
      return {
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
        usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) // %
      }
    }

    return null
  }

  static logMemoryUsage(label?: string) {
    const info = this.getMemoryInfo()
    if (info) {
      console.log(`Memory${label ? ` (${label})` : ''}:`, info)
    }
  }
}

// Network optimization utilities
export class NetworkOptimizer {
  private static connectionType: string | null = null

  static getConnectionType(): string {
    // @ts-ignore - connection is experimental
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection

    if (connection) {
      this.connectionType = connection.effectiveType || connection.type || 'unknown'
      return this.connectionType!
    }

    return 'unknown'
  }

  static isSlowConnection(): boolean {
    const type = this.getConnectionType()
    return ['slow-2g', '2g', '3g'].includes(type)
  }

  static shouldOptimizeForBandwidth(): boolean {
    return this.isSlowConnection()
  }

  // Adaptive loading based on connection
  static getOptimalImageQuality(): number {
    if (this.isSlowConnection()) {
      return 0.6 // Lower quality for slow connections
    }
    return 0.8 // Normal quality
  }

  static getOptimalPageSize(): number {
    if (this.isSlowConnection()) {
      return 10 // Smaller page sizes
    }
    return 20 // Normal page sizes
  }
}

// Performance reporting
export function generatePerformanceReport() {
  return {
    timestamp: new Date().toISOString(),
    performance: {
      timing: performance.timing,
      navigation: performance.navigation,
      memory: MemoryMonitor.getMemoryInfo(),
      connection: NetworkOptimizer.getConnectionType()
    },
    metrics: perfMonitor.exportMetrics(),
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }
}

// Auto-report performance issues
if (typeof window !== 'undefined') {
  // Report slow page loads
  window.addEventListener('load', () => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
    if (loadTime > 3000) { // Slower than 3 seconds
      console.warn('Slow page load detected:', loadTime + 'ms')
    }
  })

  // Monitor memory usage periodically
  if (MemoryMonitor.getMemoryInfo()) {
    setInterval(() => {
      const memory = MemoryMonitor.getMemoryInfo()
      if (memory && memory.usage > 80) {
        console.warn('High memory usage detected:', memory)
      }
    }, 30000) // Check every 30 seconds
  }
}