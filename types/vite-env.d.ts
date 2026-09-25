/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_BASE_URL?: string; // dev-only: tunnel host for vite dev server config
	readonly VITE_CF_BEACON_TOKEN?: string;
	readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
