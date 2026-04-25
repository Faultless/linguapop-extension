/**
 * Fetch wrapper that handles CORS across different build targets:
 * - Browser extension: direct fetch (host_permissions bypass CORS)
 * - Dev mode (any target): routes through Vite's /cors-proxy middleware
 * - Web/Mobile production: uses VITE_CORS_PROXY_URL if configured, else direct fetch
 */
export function corsFetch(url: string, options?: RequestInit): Promise<Response> {
  // @ts-ignore
  const isNative = !!(window.Capacitor?.isNativePlatform?.());

  if (isNative) {
    return fetch(url, options)
  }

  if (import.meta.env.DEV) {
    return fetch(`/cors-proxy?url=${encodeURIComponent(url)}`)
  }

  const proxyUrl = import.meta.env.VITE_CORS_PROXY_URL
  if (proxyUrl) {
    return fetch(`${proxyUrl}?url=${encodeURIComponent(url)}`)
  }

  return fetch(url, options)
}
