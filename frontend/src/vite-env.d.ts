/// <reference types="vite/client" />

declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string
    // другие переменные окружения...
  }
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
