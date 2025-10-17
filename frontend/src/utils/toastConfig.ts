/**
 * Toast Configuration for Development and Testing
 */

import toast from 'react-hot-toast'
// import { isTestingMode } from './devMode'

// Store original toast methods
const originalToast = {
  success: toast.success,
  error: toast.error,
  loading: toast.loading,
  promise: toast.promise,
  custom: toast.custom,
  dismiss: toast.dismiss,
  remove: toast.remove,
}

// Create wrapped toast methods that always show toasts
export const devToast = {
  success: (message: string, options?: any) => {
    return originalToast.success(message, options)
  },
  
  error: (message: string, options?: any) => {
    return originalToast.error(message, options)
  },
  
  loading: (message: string, options?: any) => {
    return originalToast.loading(message, options)
  },
  
  promise: (promise: Promise<any>, messages: any, options?: any) => {
    return originalToast.promise(promise, messages, options)
  },
  
  custom: (jsx: any, options?: any) => {
    return originalToast.custom(jsx, options)
  },
  
  dismiss: (toastId?: string) => {
    return originalToast.dismiss(toastId)
  },
  
  remove: (toastId?: string) => {
    return originalToast.remove(toastId)
  },
}

// Export the configured toast
export default devToast
