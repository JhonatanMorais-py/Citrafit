import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
test("mobile distribution contains public assets only", async () => {
  const root = resolve("dist/mobile");
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  for (const entry of entries.filter(entry => entry.isFile())) {
    const path = resolve(entry.parentPath, entry.name);
    assert.ok(/\.(html|css|js|svg|jpg|jpeg|png|webp|ttf)$/.test(entry.name));
    if (/\.(html|css|js|svg)$/.test(entry.name)) {
      const source = await readFile(path, "utf8");
      assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|sb_secret_|service_role|dotenv/);
    }
  }
  const html = await readFile(resolve(root, "index.html"), "utf8");
  assert.match(html, /Content-Security-Policy/);
  for (const match of html.matchAll(/(?:src|href)="(frontend\/[^\"]+)"/g)) await readFile(resolve(root, match[1]));
  const config = JSON.parse(await readFile("capacitor.config.json", "utf8"));
  assert.equal(config.server.url, undefined);
  assert.equal(config.server.cleartext, false);
  assert.equal(config.webDir, "dist/mobile");
});
