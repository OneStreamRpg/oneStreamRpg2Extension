/// <reference types="vite/client" />
/// <reference types="@types/twitch-ext" />

interface Window {
  Twitch?: {
    ext: typeof Twitch.ext;
  };
}

interface ImportMetaEnv {
    readonly VITE_SOCKET_URL: string
    readonly VITE_DEVELOPER: "true" | "false"
    readonly VITE_DISABLE_BACKEND: "true" | "false"
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}