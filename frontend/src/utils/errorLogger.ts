/**
 * Enhanced error logging utility for debugging object update issues
 */

export interface ErrorContext {
  operation: 'object_update' | 'object_create' | 'object_delete' | 'socket_connection' | 'general'
  objectId?: string
  objectType?: string
  canvasId?: string
  userId?: string
  timestamp: number
  additionalData?: any
}

export interface ErrorLogEntry {
  id: string
  error: any
  context: ErrorContext
  stack?: string
  userAgent: string
  url: string
}

class ErrorLogger {
  private errorLog: ErrorLogEntry[] = []
  private maxLogSize = 100
  private debugMode = import.meta.env.VITE_DEBUG_SOCKET === 'true'

  /**
   * Log an error with context for debugging
   */
  logError(error: any, context: ErrorContext): string {
    const errorId = this.generateErrorId()
    const logEntry: ErrorLogEntry = {
      id: errorId,
      error,
      context,
      stack: error.stack || new Error().stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Add to log
    this.errorLog.push(logEntry)
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }

    // Log to console in debug mode
    if (this.debugMode) {
      console.group(`🚨 Error Logged [${errorId}]`)
      console.error('Error:', error)
      console.log('Context:', context)
      console.log('Stack:', logEntry.stack)
      console.log('Timestamp:', new Date(context.timestamp).toISOString())
      console.groupEnd()
    }

    // Send to external logging service in production (if configured)
    this.sendToExternalLogger(logEntry)

    return errorId
  }

  /**
   * Get error log for debugging
   */
  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog]
  }

  /**
   * Get errors by operation type
   */
  getErrorsByOperation(operation: ErrorContext['operation']): ErrorLogEntry[] {
    return this.errorLog.filter(entry => entry.context.operation === operation)
  }

  /**
   * Get recent errors (last N minutes)
   */
  getRecentErrors(minutes: number = 5): ErrorLogEntry[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000)
    return this.errorLog.filter(entry => entry.context.timestamp > cutoffTime)
  }

  /**
   * Clear error log
   */
  clearLog(): void {
    this.errorLog = []
  }

  /**
   * Export error log for debugging
   */
  exportLog(): string {
    return JSON.stringify(this.errorLog, null, 2)
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number
    byOperation: Record<string, number>
    recentCount: number
    mostCommonError: string | null
  } {
    const byOperation: Record<string, number> = {}
    let mostCommonError: string | null = null
    let maxCount = 0
    const errorCounts: Record<string, number> = {}

    this.errorLog.forEach(entry => {
      // Count by operation
      const operation = entry.context.operation
      byOperation[operation] = (byOperation[operation] || 0) + 1

      // Count error types
      const errorType = entry.error?.message || entry.error?.type || 'Unknown'
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1
      
      if (errorCounts[errorType] > maxCount) {
        maxCount = errorCounts[errorType]
        mostCommonError = errorType
      }
    })

    return {
      total: this.errorLog.length,
      byOperation,
      recentCount: this.getRecentErrors(5).length,
      mostCommonError
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Send error to external logging service (placeholder for production)
   */
  private sendToExternalLogger(logEntry: ErrorLogEntry): void {
    // In production, this could send to services like:
    // - Sentry
    // - LogRocket
    // - Custom logging endpoint
    
    if (import.meta.env.PROD && import.meta.env.VITE_ERROR_LOGGING_ENDPOINT) {
      // Send to external service
      fetch(import.meta.env.VITE_ERROR_LOGGING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry)
      }).catch(err => {
        console.warn('Failed to send error to external logger:', err)
      })
    }
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger()

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  errorLogger.logError(event.error, {
    operation: 'general',
    timestamp: Date.now(),
    additionalData: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  })
})

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  errorLogger.logError(event.reason, {
    operation: 'general',
    timestamp: Date.now(),
    additionalData: {
      type: 'unhandled_promise_rejection'
    }
  })
})

// Debug helper for development
if (import.meta.env.DEV) {
  (window as any).errorLogger = errorLogger
  console.log('🔧 Error logger available as window.errorLogger for debugging')
}
