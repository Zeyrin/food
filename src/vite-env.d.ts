/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Clés publiques RevenueCat (SDK), une par store : sans elles, pas de paywall. */
  readonly VITE_REVENUECAT_IOS_KEY?: string
  readonly VITE_REVENUECAT_ANDROID_KEY?: string
}

/** Estampille du build, injectée par `define` (voir `vite.config.ts`). */
declare const __VERSION_APP__: string

interface ImportMeta {
  readonly env: ImportMetaEnv
}
