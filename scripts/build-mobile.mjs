import { mkdir, readFile, writeFile, copyFile, cp, rm } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = resolve(root, "dist/mobile");
const api = process.env.MOBILE_API_URL?.trim().replace(/\/+$/, "") || "";
if (api) {
  const parsed = new URL(api);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/" || ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)) {
    throw new Error("MOBILE_API_URL deve ser uma origem HTTPS externa, sem caminho, credenciais ou parâmetros.");
  }
}
// This exact generated directory is owned by the build, never a caller-supplied path.
if (out !== resolve(root, "dist", "mobile")) throw new Error("Unsafe build output path");
await rm(out, { recursive: true, force: true });
// Allowlist: neither backend, .env nor node_modules are ever copied.
const files = ["frontend/core/api.js", "frontend/modules/auth/login.js", "frontend/modules/auth/register.js",
  "frontend/modules/auth/register.css", "frontend/modules/profile/profile.js", "frontend/styles/mobile.css"];
for (const file of files) {
  const target = resolve(out, file);
  await mkdir(dirname(target), { recursive: true });
  await copyFile(resolve(root, file), target);
}
await cp(resolve(root, "frontend/app"), resolve(out, "frontend/app"), { recursive: true });
await mkdir(resolve(out, "frontend/config"), { recursive: true });
await writeFile(resolve(out, "frontend/config/runtime.js"), `window.RUNLIFE_CONFIG = Object.freeze(${JSON.stringify({ apiBaseUrl: api })});\n`);
const appHtmlPath = resolve(out, "frontend/app/index.html");
const appHtml = (await readFile(appHtmlPath, "utf8"))
  .replace("<!-- native-app-bootstrap -->", '<script src="../platform/native.js"></script>');
await writeFile(appHtmlPath, appHtml);
let html = await readFile(resolve(root, "index.html"), "utf8");
html = html.replace("<!-- native-bootstrap -->", '<script src="frontend/platform/native.js" defer></script>');
const csp = `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ${api}; img-src 'self' data: https://tile.openstreetmap.org; object-src 'none'; base-uri 'self'; form-action 'self'`;
html = html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" /><meta http-equiv="Content-Security-Policy" content="${csp}" />`);
await writeFile(resolve(out, "index.html"), html);
await build({ entryPoints: [resolve(root, "frontend/platform/native.js")], bundle: true, format: "iife", target: "chrome109", outfile: resolve(out, "frontend/platform/native.js") });
console.log(api ? `Mobile preparado para ${api}` : "Mobile gerado sem API: a interface abre, mas login/cadastro exigem MOBILE_API_URL HTTPS e novo build/sync.");
