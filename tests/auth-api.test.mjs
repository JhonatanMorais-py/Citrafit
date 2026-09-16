import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

test("Web and native authentication keep credentials isolated and authorize profile updates", async t => {
  const profile = { nome: "Pessoa Teste", altura_cm: 175, peso_kg: 72 };
  const user = { id: "user-owned-id", email: "test@example.com" };
  let updatedId;
  const remote = createServer(async (req, res) => {
    let body = ""; for await (const chunk of req) body += chunk;
    const url = new URL(req.url, "http://mock");
    res.setHeader("Content-Type", "application/json");
    if (url.pathname === "/auth/v1/token") {
      const data = JSON.parse(body);
      if ((url.searchParams.get("grant_type") === "password" && data.password !== "test-password") ||
          (url.searchParams.get("grant_type") === "refresh_token" && data.refresh_token !== "refresh-test")) {
        res.writeHead(400); res.end('{}'); return;
      }
      res.end(JSON.stringify({ user, access_token: "access-test", refresh_token: "refresh-test", expires_in: 3600 })); return;
    }
    if (url.pathname === "/auth/v1/user") {
      if (req.headers.authorization !== "Bearer access-test") { res.writeHead(401); res.end('{}'); return; }
      res.end(JSON.stringify(user)); return;
    }
    if (url.pathname === "/auth/v1/logout") { res.writeHead(204); res.end(); return; }
    if (url.pathname === "/rest/v1/cad_perfis") {
      if (req.method === "PATCH") updatedId = url.searchParams.get("id");
      res.end(JSON.stringify(profile)); return;
    }
    res.writeHead(404); res.end('{}');
  });
  remote.listen(0, "127.0.0.1"); await once(remote, "listening");
  const child = spawn(process.execPath, ["backend/server.js"], { env: {
    ...process.env, SUPABASE_URL: `http://127.0.0.1:${remote.address().port}`, SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
    APP_PORT: "0", APP_HOST: "127.0.0.1", NODE_ENV: "production",
  }, stdio: ["ignore", "pipe", "pipe"] });
  t.after(() => { child.kill(); remote.close(); remote.closeAllConnections(); });
  let stdout = ""; let stderr = "";
  child.stdout.on("data", chunk => { stdout += chunk; });
  child.stderr.on("data", chunk => { stderr += chunk; });
  for (let i = 0; i < 100 && !stdout.includes("http://"); i++) {
    if (child.exitCode !== null) throw new Error(stderr);
    await delay(50);
  }
  const base = stdout.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
  assert.ok(base, "server started");
  const login = { email: user.email, password: "test-password" };
  const json = { "Content-Type": "application/json" };
  const native = { ...json, Origin: "https://localhost", "X-Runlife-Client": "native" };
  let res = await fetch(base + "/api/login", { method: "POST", headers: json, body: JSON.stringify(login) });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).session, undefined);
  assert.match(res.headers.get("set-cookie"), /HttpOnly; SameSite=Strict; Secure/);
  res = await fetch(base + "/api/login", { method: "POST", headers: native, body: JSON.stringify(login) });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).session.accessToken, "access-test");
  assert.equal(res.headers.get("set-cookie"), null);
  assert.equal(res.headers.get("access-control-allow-origin"), "https://localhost");
  assert.equal(res.headers.get("access-control-allow-credentials"), null);
  res = await fetch(base + "/api/login", { method: "OPTIONS", headers: { Origin: "https://evil.example" } });
  assert.equal(res.status, 403);
  res = await fetch(base + "/api/login", { method: "OPTIONS", headers: { Origin: "https://localhost" } });
  assert.equal(res.status, 204);
  res = await fetch(base + "/api/perfil", { method: "PUT", headers: { ...native, Cookie: "rl_access_token=access-test" }, body: '{}' });
  assert.equal(res.status, 401, "native cannot authenticate with Web cookies");
  res = await fetch(base + "/api/perfil", { method: "PUT", headers: { ...native, Authorization: "Bearer access-test" }, body: JSON.stringify({ height: 180, weight: 80, id: "another-user" }) });
  assert.equal(res.status, 200); assert.equal(updatedId, "eq.user-owned-id");
  res = await fetch(base + "/api/sessao", { headers: { Cookie: "rl_access_token=access-test" } });
  assert.equal((await res.json()).user.id, user.id);
  res = await fetch(base + "/api/sessao/renovar", { method: "POST", headers: native, body: JSON.stringify({ refreshToken: "refresh-test" }) });
  assert.equal((await res.json()).session.accessToken, "access-test");
  res = await fetch(base + "/api/sessao/renovar", { method: "POST", headers: { ...json, Cookie: "rl_refresh_token=refresh-test" } });
  assert.equal((await res.json()).session, undefined); assert.match(res.headers.get("set-cookie"), /Secure/);
  res = await fetch(base + "/api/logout", { method: "POST", headers: { ...native, Authorization: "Bearer access-test" } });
  assert.equal((await res.json()).remoteFailed, false);
  for (const path of ["/.env", "/backend/config/env.js", "/package.json"]) {
    assert.equal((await fetch(base + path)).status, 404);
  }
});
