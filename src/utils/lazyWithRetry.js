import { lazy } from 'react';

/**
 * Robust lazy import with automatic cache-busting reload for stale deployment chunks.
 * When a new deployment is pushed to production, users with an active tab have
 * old chunk hashes in memory. This helper catches dynamic import failures and
 * forces a hard refresh with a timestamp query param to bypass mobile browser disk cache.
 */
export function lazyWithRetry(componentImport) {
  return lazy(async () => {
    const lastReloadTimestamp = parseInt(
      window.sessionStorage.getItem('securekaro_last_chunk_reload') || '0',
      10
    );
    const now = Date.now();
    // Allow auto-refresh if at least 8 seconds have passed since the last reload
    const canAttemptReload = (now - lastReloadTimestamp) > 8000;

    try {
      const component = await componentImport();
      return component;
    } catch (error) {
      console.warn('[SecureKaro LazyLoader] Chunk load error caught:', error?.message);

      const errorText = `${error?.name || ''} ${error?.message || ''} ${error?.toString?.() || ''}`;
      const isChunkLoadError = 
        errorText.includes('Failed to fetch dynamically imported module') ||
        errorText.includes('error loading dynamically imported module') ||
        errorText.includes('Importing a module script failed') ||
        errorText.includes('Loading chunk') ||
        error?.name === 'ChunkLoadError' ||
        (error instanceof SyntaxError && errorText.includes("Unexpected token '<'"));

      if (isChunkLoadError && canAttemptReload) {
        window.sessionStorage.setItem('securekaro_last_chunk_reload', now.toString());
        // Force the browser to fetch the brand new index.html with new chunk hashes from the server
        const cleanUrl = window.location.pathname + (window.location.search ? window.location.search + '&' : '?') + '_v=' + now;
        window.location.replace(cleanUrl);
        // Return a pending promise so React Suspense waits without throwing the error to ErrorBoundary
        return new Promise(() => {});
      }

      throw error;
    }
  });
}


