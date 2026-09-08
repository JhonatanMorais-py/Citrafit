import { authenticateUser } from "./login-service.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginController(request, response, readJson, sendJson) {
  try {
    const payload = await readJson(request);
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const password = typeof payload.password === "string" ? payload.password : "";

    if (!EMAIL_PATTERN.test(email) || !password) {
      return sendJson(response, 422, { error: "Informe e-mail e senha válidos." });
    }

    const result = await authenticateUser({ email, password });
    if (result.error) {
      return sendJson(response, 401, { error: "E-mail ou senha incorretos." });
    }

    const maxAge = Number(result.session.expiresIn || 3600);
    response.setHeader("Set-Cookie", [
      `rl_access_token=${encodeURIComponent(result.session.accessToken)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
      `rl_refresh_token=${encodeURIComponent(result.session.refreshToken)}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=2592000`,
    ]);

    return sendJson(response, 200, { user: result.user });
  } catch (error) {
    console.error("Falha interna no login.", {
      code: error.code || "UNKNOWN",
      status: error.status || null,
      message: error.message || "Erro sem mensagem",
    });
    return sendJson(response, 500, { error: "Não foi possível entrar agora." });
  }
}
