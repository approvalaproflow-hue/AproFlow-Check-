export const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === "string" && input.startsWith("/api/")) {
    const envBackendUrl = (import.meta.env as any).VITE_BACKEND_URL;
    if (envBackendUrl) {
      const targetUrl = `${envBackendUrl.replace(/\/$/, "")}${input}`;
      return globalThis.fetch(targetUrl, init);
    }

    // Auto-detect any external/static hosting environments (Netlify, Vercel, GitHub Pages, Custom Domains)
    // If the host is not a .run.app container and not localhost, it is a static frontend deployment.
    const isCloudRun = window.location.hostname.endsWith(".run.app");
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const isStaticHost = !isCloudRun && !isLocalhost;

    if (isStaticHost) {
      const preBackendUrl = "https://ais-pre-uqgotynwpn7qsbyjr4rsar-880186503088.asia-southeast1.run.app";
      const devBackendUrl = "https://ais-dev-uqgotynwpn7qsbyjr4rsar-880186503088.asia-southeast1.run.app";
      
      try {
        const targetUrl = `${preBackendUrl}${input}`;
        const response = await globalThis.fetch(targetUrl, init);
        
        // If the shared/production container is suspended, returns gateway error or 404, fallback to active dev container
        if (!response.ok && (response.status === 404 || response.status === 502 || response.status === 503 || response.status === 504)) {
          const fallbackUrl = `${devBackendUrl}${input}`;
          return await globalThis.fetch(fallbackUrl, init);
        }
        return response;
      } catch (err) {
        // Network connection failed (e.g. CORS or container scaled down/inactive) - try the live development API container
        try {
          const fallbackUrl = `${devBackendUrl}${input}`;
          return await globalThis.fetch(fallbackUrl, init);
        } catch (fallbackErr) {
          // If both fail, let the original error bubble up
          throw err;
        }
      }
    }
  }
  return globalThis.fetch(input, init);
};
