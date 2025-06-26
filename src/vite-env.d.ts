/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_EXT_TYPE: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}