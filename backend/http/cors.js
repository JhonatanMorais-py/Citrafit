// Explicit origins only; native requests must never fall back to Web cookies.
export function handleCors(request, response, origins) {
  const origin = request.headers.origin;
  const native = request.headers["x-runlife-client"] === "native";
  if (origin && origins.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Runlife-Client");
    // No cross-origin cookies. Web continues to use same-origin requests.
  } else if (native && origin) {
    response.writeHead(403); response.end(); return true;
  }
  if (request.method === "OPTIONS") {
    response.writeHead(origin && origins.includes(origin) ? 204 : 403);
    response.end(); return true;
  }
  // Browsers must not use cookies from a foreign origin to mutate sessions.
  if (origin && !native && !["GET", "HEAD"].includes(request.method)) {
    let sameHost = false;
    try { sameHost = new URL(origin).host === request.headers.host; } catch {}
    if (!sameHost) { response.writeHead(403); response.end(); return true; }
  }
  return false;
}
