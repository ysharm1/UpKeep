/**
 * Configuration utilities for the application
 */

/**
 * Get the application URL for the current environment
 * Priority order:
 * 1. NEXT_PUBLIC_APP_URL (explicit configuration)
 * 2. VERCEL_URL (automatic in Vercel deployments)
 * 3. localhost:3000 (development fallback)
 */
export function getAppUrl(): string {
  // Explicit configuration takes priority
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Vercel automatic URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Development fallback
  return 'http://localhost:3000'
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}
