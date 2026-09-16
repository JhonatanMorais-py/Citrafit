const WINDOW_MS = 15 * 60 * 1000;
const registrationAttempts = new Map();
const loginAttempts = new Map();
const sessionAttempts = new Map();

function allow(request, attempts, maxAttempts) {
  const identifier = String(request.socket.remoteAddress || "unknown");
  const now = Date.now();
  const current = attempts.get(identifier);

  if (!current || now - current.startedAt >= WINDOW_MS) {
    attempts.set(identifier, { count: 1, startedAt: now });
    return true;
  }

  if (current.count >= maxAttempts) return false;
  current.count += 1;
  return true;
}

export function allowRegistration(request) {
  return allow(request, registrationAttempts, 5);
}

export function allowLogin(request) {
  return allow(request, loginAttempts, 10);
}

export function allowSession(request) {
  return allow(request, sessionAttempts, 120);
}
