import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = resolve(fileURLToPath(new URL(".", import.meta.url)));
const projectRoot = resolve(moduleDirectory, "../..");
const publicFiles = new Map([
  ["/", resolve(projectRoot, "index.html")],
  ["/index.html", resolve(projectRoot, "index.html")],
]);
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".png", "image/png"],
  [".ttf", "font/ttf"],
]);

export async function serveStatic(pathname, response) {
  let filePath = publicFiles.get(pathname);

  if (!filePath && pathname.startsWith("/frontend/")) {
    const frontendRoot = resolve(projectRoot, "frontend");
    const candidate = resolve(projectRoot, `.${pathname}`);
    if (candidate.startsWith(`${frontendRoot}${sep}`)) filePath = candidate;
  }

  if (!filePath) return false;

  try {
    const file = await stat(filePath);
    if (!file.isFile()) return false;
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(extname(filePath)) || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https://tile.openstreetmap.org; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
    });
    createReadStream(filePath).pipe(response);
    return true;
  } catch {
    return false;
  }
}
