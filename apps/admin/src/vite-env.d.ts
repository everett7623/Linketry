/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LINKETRY_REPOSITORY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
