import { lazy } from 'react';

/**
 * Robust lazy import with automatic retry and cache busting for stale deployment chunks.
 * When a new deployment is pushed to production, users with an active tab can have
 * stale chunk hashes in memory. This helper catches dynamic import failures, verifies
 * whether a reload was already attempted in this session, and reloads the page once
 * to seamlessly fetch the latest version instead of throwing an Application Error.
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('securekaro_chunk_reloaded') || 'false'
    );

    try {
      const component = await componentImport();
      // Successful load - clear reload flag
      window.sessionStorage.setItem('securekaro_chunk_reloaded', 'false');
      return component;
    } catch (error) {
      console.warn('[SecureKaro LazyLoader] Chunk load error detected:', error?.message);

      const isChunkLoadError = 
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('error loading dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.message?.includes('Loading chunk') ||
        error?.name === 'ChunkLoadError' ||
        (error instanceof SyntaxError && error?.message?.includes("Unexpected token '<'"));

      if (isChunkLoadError && !pageHasBeenForceRefreshed) {
        window.sessionStorage.setItem('securekaro_chunk_reloaded', 'true');
        // Force reload without cache
        window.location.reload();
        // Return a pending promise so React Suspense waits without throwing
        return new Promise(() => {});
      }

      window.sessionStorage.setItem('securekaro_chunk_reloaded', 'false');
      throw error;
    }
  });
}

