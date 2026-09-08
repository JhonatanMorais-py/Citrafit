import { env } from "../../config/env.js";
import { readCookies } from "../../http/cookies.js";

const clearSessionCookies = (response) => {
  response.setHeader("Set-Cookie", [
    "rl_access_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
    "rl_refresh_token=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0",
  ]);
};

export async function logoutController(request, response, sendJson) {
  const cookies = readCookies(request);
  const accessToken = cookies.rl_access_token;

  try {
    if (accessToken) {
      const baseUrl = env.supabaseUrl.replace(/\/+$/, "");
      await fetch(`${baseUrl}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: env.supabaseServiceRoleKey,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  } catch {
    console.error("Não foi possível encerrar a sessão remota.");
  } finally {
    clearSessionCookies(response);
  }

  return sendJson(response, 200, { message: "Sessão encerrada com segurança." });
}
