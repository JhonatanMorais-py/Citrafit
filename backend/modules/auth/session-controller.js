import { env } from "../../config/env.js";
import { supabaseAdmin } from "../../config/supabase.js";
import { readCookies } from "../../http/cookies.js";
import { accessToken, deliverSession, isNativeRequest, sessionCookies } from "../../http/session.js";
import { getAuthenticatedUser } from "../profile/profile-service.js";

export async function publicUser(user) {
  const { data, error } = await supabaseAdmin.from("cad_perfis")
    .select("nome, altura_cm, peso_kg").eq("id", user.id).single();
  if (error) throw error;
  return { id: user.id, email: user.email, name: data.nome, height: data.altura_cm, weight: data.peso_kg };
}
export async function sessionController(request, response, readJson, sendJson) {
  try {
    if (request.method === "GET") {
      const user = await getAuthenticatedUser(accessToken(request));
      if (!user) return sendJson(response, 401, { error: "Sessão expirada." });
      return sendJson(response, 200, { user: await publicUser(user) });
    }
    const payload = isNativeRequest(request) ? await readJson(request) : {};
    const refreshToken = isNativeRequest(request) ? payload.refreshToken : readCookies(request).rl_refresh_token;
    if (typeof refreshToken !== "string" || !refreshToken) return sendJson(response, 401, { error: "Entre novamente." });
    const remote = await fetch(`${env.supabaseUrl.replace(/\/+$/, "")}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST", headers: { apikey: env.supabaseServiceRoleKey, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }), signal: AbortSignal.timeout(15000),
    });
    if (!remote.ok) {
      if (remote.status >= 500 || remote.status === 429) return sendJson(response, 503, { error: "Tente novamente em instantes." });
      if (!isNativeRequest(request)) sessionCookies(response);
      return sendJson(response, 401, { error: "Entre novamente." });
    }
    const data = await remote.json();
    const result = { user: await publicUser(data.user), session: {
      accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in,
    } };
    return sendJson(response, 200, deliverSession(request, response, result));
  } catch {
    return sendJson(response, 503, { error: "Não foi possível recuperar sua sessão agora." });
  }
}
