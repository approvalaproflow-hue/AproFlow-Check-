export const customFetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  if (typeof input === "string" && input.startsWith("/api/")) {
    const isServerHost = 
      window.location.hostname.endsWith(".run.app") || 
      window.location.hostname === "localhost" || 
      window.location.hostname === "127.0.0.1";
    if (!isServerHost) {
      // Connect specifically to the remote secure production backend container
      const backendUrl = "https://ais-pre-uqgotynwpn7qsbyjr4rsar-880186503088.asia-southeast1.run.app";
      const targetUrl = `${backendUrl}${input}`;
      return globalThis.fetch(targetUrl, init);
    }
  }
  return globalThis.fetch(input, init);
};
