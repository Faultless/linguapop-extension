interface ImportMetaEnv {
  readonly DEV: boolean
  readonly VITE_CORS_PROXY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
