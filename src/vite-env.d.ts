/// <reference types="vite/client" />
/// <reference types="@types/twitch-ext" />

interface Window {
  Twitch?: {
    ext: typeof Twitch.ext;
  };
}

interface ImportMetaEnv {
    /** Single public origin — no port, no path. e.g. https://onestreamrpg.pauledevelopment.com */
    readonly VITE_API_BASE: string
    /** @deprecated per-lobby-port URL; read only as a fallback for VITE_API_BASE. */
    readonly VITE_SOCKET_URL?: string
    readonly VITE_DEVELOPER: "true" | "false"
    readonly VITE_DISABLE_BACKEND: "true" | "false"
    readonly VITE_DEBUG_WORLD_INTERACTION?: "true" | "false"
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}