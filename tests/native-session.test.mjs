import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("native refresh is shared by concurrent requests and logout removes persisted credentials", async () => {
  let saved = "refresh-test";
  let refreshes = 0;
  const calls = [];
  const window = {
    Capacitor: { isNativePlatform: () => true },
    RUNLIFE_CONFIG: { apiBaseUrl: "https://api.example.com" },
    RunlifeNative: { vault: { get: async () => ({ value: saved }), set: async ({ value }) => { saved = value; }, clear: async () => { saved = ""; } } },
    dispatchEvent: () => {},
  };
  const context = vm.createContext({ window, AbortController, setTimeout, clearTimeout, Event, fetch: async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/renovar")) {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 20));
      return { ok: true, json: async () => ({ user: {}, session: { accessToken: "new-access", refreshToken: "new-refresh" } }) };
    }
    if (url.endsWith("/logout")) return { ok: true, json: async () => ({ remoteFailed: false }) };
    if (options.headers.Authorization !== "Bearer new-access") return { ok: false, status: 401, json: async () => ({ error: "Expired" }) };
    return { ok: true, json: async () => ({ user: {} }) };
  } });
  vm.runInContext(await readFile("frontend/core/api.js", "utf8"), context);
  await Promise.all([window.RunlifeApi.request("/api/sessao"), window.RunlifeApi.request("/api/sessao")]);
  assert.equal(refreshes, 1);
  assert.equal(saved, "new-refresh");
  for (const { options } of calls) {
    assert.equal(options.credentials, "omit");
    assert.equal(options.headers["X-Runlife-Client"], "native");
  }
  await window.RunlifeApi.logout();
  assert.equal(saved, "");
});

test("native build without API never sends login credentials to local origin", async () => {
  let calls = 0;
  const window = { Capacitor: { isNativePlatform: () => true }, RUNLIFE_CONFIG: { apiBaseUrl: "" } };
  const context = vm.createContext({ window, AbortController, setTimeout, clearTimeout, fetch: async () => { calls++; } });
  vm.runInContext(await readFile("frontend/core/api.js", "utf8"), context);
  await assert.rejects(window.RunlifeApi.login({ email: "test@example.com", password: "test-only" }), /não está conectado/);
  assert.equal(calls, 0);
});
