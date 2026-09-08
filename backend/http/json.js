const MAX_BODY_SIZE = 16 * 1024;

export function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
}

export async function readJson(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
      const error = new Error("Payload too large");
      error.code = "PAYLOAD_TOO_LARGE";
      throw error;
    }
  }

  try {
    return JSON.parse(body || "{}");
  } catch {
    const error = new Error("Invalid JSON");
    error.code = "INVALID_JSON";
    throw error;
  }
}
