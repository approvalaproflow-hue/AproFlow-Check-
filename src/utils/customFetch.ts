export const customFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === "string" && input.startsWith("/api/")) {
    const envBackendUrl = (import.meta.env as any).VITE_BACKEND_URL;
    if (envBackendUrl) {
      const targetUrl = `${envBackendUrl.replace(/\/$/, "")}${input}`;
      return globalThis.fetch(targetUrl, init);
    }

    // Direct known static-only environments to the live Cloud Run backend container
    const isStaticHost = window.location.hostname.endsWith(".github.io");
    if (isStaticHost) {
      const backendUrl = "https://ais-pre-uqgotynwpn7qsbyjr4rsar-880186503088.asia-southeast1.run.app";
      const targetUrl = `${backendUrl}${input}`;
      return globalThis.fetch(targetUrl, init);
    }
  }
  return globalThis.fetch(input, init);
};
