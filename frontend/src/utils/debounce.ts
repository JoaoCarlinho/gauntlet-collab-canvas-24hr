/**
 * Debounce utility for optimizing rapid function calls
 */

export interface DebounceOptions {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  cancel(): void
  flush(): ReturnType<T> | undefined
  pending(): boolean
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  let timeoutId: NodeJS.Timeout | null = null
  let maxTimeoutId: NodeJS.Timeout | null = null
  let lastCallTime = 0
  let lastInvokeTime = 0
  let lastArgs: Parameters<T> | undefined
  let lastThis: any
  let result: ReturnType<T> | undefined
  let leading = false
  let trailing = true
  let maxWait = false

  if (typeof func !== 'function') {
    throw new TypeError('Expected a function')
  }

  wait = Number(wait) || 0
  if (typeof options === 'object') {
    leading = !!options.leading
    trailing = 'trailing' in options ? !!options.trailing : trailing
    maxWait = 'maxWait' in options
  }

  function invokeFunc(time: number) {
    const args = lastArgs
    const thisArg = lastThis

    lastArgs = undefined
    lastThis = undefined
    lastInvokeTime = time
    result = func.apply(thisArg, args!)
    return result
  }

  function leadingEdge(time: number) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time
    // Start the timer for the trailing edge.
    timeoutId = setTimeout(timerExpired, wait)
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    return maxWait
      ? Math.min(timeWaiting, (options.maxWait || 0) - timeSinceLastInvoke)
      : timeWaiting
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait && timeSinceLastInvoke >= (options.maxWait || 0))
    )
  }

  function timerExpired() {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    // Restart the timer.
    timeoutId = setTimeout(timerExpired, remainingWait(time))
  }

  function trailingEdge(time: number) {
    timeoutId = null

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = undefined
    lastThis = undefined
    return result
  }

  function cancel() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    if (maxTimeoutId !== null) {
      clearTimeout(maxTimeoutId)
    }
    lastInvokeTime = 0
    lastCallTime = 0
    lastArgs = undefined
    lastThis = undefined
    timeoutId = null
    maxTimeoutId = null
  }

  function flush() {
    return timeoutId === null ? result : trailingEdge(Date.now())
  }

  function pending() {
    return timeoutId !== null
  }

  function debounced(this: any, ...args: Parameters<T>) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this as any
    lastCallTime = time

    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(lastCallTime)
      }
      if (maxWait) {
        // Handle invocations in a tight loop.
        timeoutId = setTimeout(timerExpired, wait)
        return invokeFunc(lastCallTime)
      }
    }
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, wait)
    }
    return result
  }

  debounced.cancel = cancel
  debounced.flush = flush
  debounced.pending = pending

  return debounced
}

/**
 * Throttle utility for limiting function execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): DebouncedFunction<T> {
  let leading = true
  let trailing = true

  if (typeof func !== 'function') {
    throw new TypeError('Expected a function')
  }
  if (typeof options === 'object') {
    leading = 'leading' in options ? !!options.leading : leading
    trailing = 'trailing' in options ? !!options.trailing : trailing
  }
  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait
  })
}

/**
 * Specialized debounce for object updates with priority handling
 */
export class ObjectUpdateDebouncer {
  private debouncedUpdates = new Map<string, DebouncedFunction<any>>()
  private updateQueue = new Map<string, { args: any[]; timestamp: number; priority: number }>()
  private readonly defaultWait = 300 // 300ms default debounce
  private readonly highPriorityWait = 100 // 100ms for high priority updates
  private readonly lowPriorityWait = 500 // 500ms for low priority updates

  /**
   * Debounce an object update with priority-based timing
   */
  debounceUpdate<T extends (...args: any[]) => any>(
    objectId: string,
    updateFunction: T,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): DebouncedFunction<T> {
    // Cancel existing debounced function for this object
    const existing = this.debouncedUpdates.get(objectId)
    if (existing) {
      existing.cancel()
    }

    // Determine wait time based on priority
    const waitTime = priority === 'high' 
      ? this.highPriorityWait 
      : priority === 'low' 
        ? this.lowPriorityWait 
        : this.defaultWait

    // Create new debounced function
    const debouncedFn = debounce(updateFunction, waitTime, {
      leading: false,
      trailing: true
    })

    // Store the debounced function
    this.debouncedUpdates.set(objectId, debouncedFn)

    return debouncedFn
  }

  /**
   * Cancel debounced update for specific object
   */
  cancelUpdate(objectId: string): void {
    const debouncedFn = this.debouncedUpdates.get(objectId)
    if (debouncedFn) {
      debouncedFn.cancel()
      this.debouncedUpdates.delete(objectId)
    }
    this.updateQueue.delete(objectId)
  }

  /**
   * Flush pending update for specific object
   */
  flushUpdate(objectId: string): any {
    const debouncedFn = this.debouncedUpdates.get(objectId)
    if (debouncedFn) {
      return debouncedFn.flush()
    }
  }

  /**
   * Check if object has pending updates
   */
  hasPendingUpdate(objectId: string): boolean {
    const debouncedFn = this.debouncedUpdates.get(objectId)
    return debouncedFn ? debouncedFn.pending() : false
  }

  /**
   * Get all objects with pending updates
   */
  getPendingObjects(): string[] {
    const pending: string[] = []
    for (const [objectId, debouncedFn] of this.debouncedUpdates) {
      if (debouncedFn.pending()) {
        pending.push(objectId)
      }
    }
    return pending
  }

  /**
   * Cancel all pending updates
   */
  cancelAllUpdates(): void {
    for (const debouncedFn of this.debouncedUpdates.values()) {
      debouncedFn.cancel()
    }
    this.debouncedUpdates.clear()
    this.updateQueue.clear()
  }

  /**
   * Flush all pending updates
   */
  flushAllUpdates(): void {
    for (const debouncedFn of this.debouncedUpdates.values()) {
      debouncedFn.flush()
    }
  }

  /**
   * Get statistics about debounced updates
   */
  getStats() {
    return {
      totalObjects: this.debouncedUpdates.size,
      pendingObjects: this.getPendingObjects().length,
      queuedUpdates: this.updateQueue.size
    }
  }
}

// Create singleton instance for object updates
export const objectUpdateDebouncer = new ObjectUpdateDebouncer()
