/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_EXT_TYPE: "panel" | "overlay"
    readonly VITE_SOCKET_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}