/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_RUNNER_PARENT_ORIGINS?: string;
	readonly VITE_RUNNER_FALLBACK_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
