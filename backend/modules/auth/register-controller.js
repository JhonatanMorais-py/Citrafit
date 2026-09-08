import { registerUser } from "./register-service.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(payload) {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (name.length < 3 || name.length > 120) return { error: "Nome inválido." };
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return { error: "E-mail inválido." };
  if (password.length < 8 || password.length > 72) return { error: "A senha deve ter entre 8 e 72 caracteres." };

  return { value: { name, email, password } };
}

export async function registerController(request, response, readJson, sendJson) {
  try {
    const payload = await readJson(request);
    const validation = validate(payload);

    if (validation.error) {
      return sendJson(response, 422, { error: validation.error });
    }

    const result = await registerUser(validation.value);
    if (result.error === "EMAIL_ALREADY_REGISTERED") {
      return sendJson(response, 409, { error: "Este e-mail já está cadastrado." });
    }

    return sendJson(response, 201, {
      message: "Conta criada com sucesso. Você já pode entrar no aplicativo.",
      user: result.user,
    });
  } catch (error) {
    if (error.code === "INVALID_JSON" || error.code === "PAYLOAD_TOO_LARGE") {
      return sendJson(response, 400, { error: "Requisição inválida." });
    }

    console.error("Falha interna ao criar cadastro.", {
      code: error.code || "UNKNOWN",
      status: error.status || null,
      message: error.message || "Erro sem mensagem",
    });
    return sendJson(response, 500, { error: "Não foi possível criar sua conta agora." });
  }
}
