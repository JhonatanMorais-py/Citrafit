import { createServer } from "node:http";

import { env } from "./config/env.js";
import { readJson, sendJson } from "./http/json.js";
import { allowLogin, allowRegistration } from "./http/rate-limit.js";
import { serveStatic } from "./http/static.js";
import { registerController } from "./modules/auth/register-controller.js";
import { loginController } from "./modules/auth/login-controller.js";
import { logoutController } from "./modules/auth/logout-controller.js";
import { updateProfileController } from "./modules/profile/profile-controller.js";

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  if (request.method === "POST" && url.pathname === "/api/cadastro") {
    if (!allowRegistration(request)) {
      return sendJson(response, 429, { error: "Muitas tentativas. Aguarde alguns minutos." });
    }
    return registerController(request, response, readJson, sendJson);
  }

  if (request.method === "POST" && url.pathname === "/api/login") {
    if (!allowLogin(request)) {
      return sendJson(response, 429, { error: "Muitas tentativas. Aguarde alguns minutos." });
    }
    return loginController(request, response, readJson, sendJson);
  }

  if (request.method === "POST" && url.pathname === "/api/logout") {
    return logoutController(request, response, sendJson);
  }

  if (request.method === "PUT" && url.pathname === "/api/perfil") {
    return updateProfileController(request, response, readJson, sendJson);
  }

  if (request.method === "GET" && await serveStatic(url.pathname, response)) return;

  return sendJson(response, 404, { error: "Rota não encontrada." });
});

server.listen(env.appPort, "127.0.0.1", () => {
  console.log(`RUN/LIFE disponível em http://127.0.0.1:${env.appPort}`);
});
