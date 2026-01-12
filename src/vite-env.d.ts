/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_EXT_TYPE: "panel" | "overlay"
    readonly VITE_SOCKET_URL: string
    readonly VITE_DEVELOPER: "true" | "false"
    readonly VITE_DISABLE_BACKEND: "true" | "false"
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}