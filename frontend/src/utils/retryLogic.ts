/**
 * Retry logic utilities for handling failed operations
 */

export interface RetryOptions {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: any
  attempts: number
  totalTime: number
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 8000,  // 8 seconds
  backoffMultiplier: 2,
  jitter: true
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const exponentialDelay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1)
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay)
  
  if (options.jitter) {
    // Add random jitter (±25% of the delay)
    const jitterRange = cappedDelay * 0.25
    const jitter = (Math.random() - 0.5) * 2 * jitterRange
    return Math.max(0, cappedDelay + jitter)
  }
  
  return cappedDelay
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const finalOptions = { ...DEFAULT_RETRY_OPTIONS, ...options }
  const startTime = Date.now()
  let lastError: any

  for (let attempt = 1; attempt <= finalOptions.maxAttempts; attempt++) {
    try {
      const data = await operation()
      return {
        success: true,
        data,
        attempts: attempt,
        totalTime: Date.now() - startTime
      }
    } catch (error) {
      lastError = error
      
      // Don't wait after the last attempt
      if (attempt < finalOptions.maxAttempts) {
        const delay = calculateDelay(attempt, finalOptions)
        await sleep(delay)
      }
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: finalOptions.maxAttempts,
    totalTime: Date.now() - startTime
  }
}

/**
 * Retry an operation with custom retry condition
 */
export async function retryWithCondition<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: any, attempt: number) => boolean,
  options: Partial<RetryOptions> = {}
): Promise<RetryResult<T>> {
  const finalOptions = { ...DEFAULT_RETRY_OPTIONS, ...options }
  const startTime = Date.now()
  let lastError: any

  for (let attempt = 1; attempt <= finalOptions.maxAttempts; attempt++) {
    try {
      const data = await operation()
      return {
        success: true,
        data,
        attempts: attempt,
        totalTime: Date.now() - startTime
      }
    } catch (error) {
      lastError = error
      
      // Check if we should retry this error
      if (!shouldRetry(error, attempt) || attempt >= finalOptions.maxAttempts) {
        break
      }
      
      const delay = calculateDelay(attempt, finalOptions)
      await sleep(delay)
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: finalOptions.maxAttempts,
    totalTime: Date.now() - startTime
  }
}

/**
 * Check if an error is retryable (network errors, timeouts, etc.)
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false
  
  // Network errors
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return true
  }
  
  // Timeout errors
  if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
    return true
  }
  
  // HTTP status codes that are retryable
  if (error.response?.status) {
    const status = error.response.status
    return status >= 500 || status === 408 || status === 429
  }
  
  // Socket connection errors
  if (error.message?.includes('socket') || error.message?.includes('connection')) {
    return true
  }
  
  return false
}

/**
 * Create a retryable operation wrapper
 */
export function createRetryableOperation<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
) {
  return () => retryWithBackoff(operation, options)
}

/**
 * Retry configuration presets
 */
export const RETRY_PRESETS = {
  // Quick retry for real-time operations
  QUICK: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    backoffMultiplier: 2,
    jitter: true
  },
  
  // Standard retry for most operations
  STANDARD: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffMultiplier: 2,
    jitter: true
  },
  
  // Aggressive retry for critical operations
  AGGRESSIVE: {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 16000,
    backoffMultiplier: 2,
    jitter: true
  },
  
  // Conservative retry for non-critical operations
  CONSERVATIVE: {
    maxAttempts: 2,
    baseDelay: 2000,
    maxDelay: 4000,
    backoffMultiplier: 2,
    jitter: false
  }
} as const
