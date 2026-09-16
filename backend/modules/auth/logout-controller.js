import { env } from "../../config/env.js";
import { accessToken as requestToken, isNativeRequest, sessionCookies } from "../../http/session.js";

const clearSessionCookies = (response) => {
  sessionCookies(response);
};

export async function logoutController(request, response, sendJson) {
  const accessToken = requestToken(request);
  let remoteFailed = false;

  try {
    if (accessToken) {
      const baseUrl = env.supabaseUrl.replace(/\/+$/, "");
      const remote = await fetch(`${baseUrl}/auth/v1/logout?scope=local`, {
        method: "POST",
        headers: {
          apikey: env.supabaseServiceRoleKey,
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(15000),
      });
      remoteFailed = !remote.ok && remote.status !== 401 && remote.status !== 403;
    }
  } catch {
    remoteFailed = true;
    console.error("Não foi possível encerrar a sessão remota.");
  } finally {
    if (!isNativeRequest(request)) clearSessionCookies(response);
  }

  return sendJson(response, 200, { message: "Sessão local encerrada.", remoteFailed });
}
