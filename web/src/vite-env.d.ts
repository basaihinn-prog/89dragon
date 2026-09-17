/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_KEY?: string;
  readonly VITE_WS_BASE_URL?: string;
  readonly VITE_IMAGE_BASE_URL?: string;
  readonly VITE_GAME_LAUNCHER_BASE_URL?: string;
  readonly VITE_APP_VERSION_CODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
