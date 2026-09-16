import { accessToken } from "../../http/session.js";
import { getAuthenticatedUser, updateProfile } from "./profile-service.js";

export async function updateProfileController(request, response, readJson, sendJson) {
  try {
    const user = await getAuthenticatedUser(accessToken(request));
    if (!user) return sendJson(response, 401, { error: "Sessão inválida. Entre novamente." });

    const payload = await readJson(request);
    const height = Number(payload.height);
    const weight = Number(payload.weight);

    if (!Number.isFinite(height) || height < 80 || height > 250) {
      return sendJson(response, 422, { error: "Informe uma altura válida entre 80 e 250 cm." });
    }
    if (!Number.isFinite(weight) || weight < 25 || weight > 350) {
      return sendJson(response, 422, { error: "Informe um peso válido entre 25 e 350 kg." });
    }

    const profile = await updateProfile(user.id, { height, weight });
    return sendJson(response, 200, {
      message: "Dados atualizados com sucesso.",
      profile: { height: profile.altura_cm, weight: profile.peso_kg },
    });
  } catch (error) {
    console.error("Falha interna ao atualizar perfil.", {
      code: error.code || "UNKNOWN",
      status: error.status || null,
      message: error.message || "Erro sem mensagem",
    });
    return sendJson(response, 500, { error: "Não foi possível atualizar seus dados agora." });
  }
}
