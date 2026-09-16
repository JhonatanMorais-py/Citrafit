import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const env = { ...process.env };
// Prevent an unrelated DEBUG environment variable from echoing the Gradle batch file.
env.DEBUG = "";
const portable = resolve(root, ".tools/jdk21");
if (!env.JAVA_HOME && existsSync(portable)) {
  const folder = readdirSync(portable).find(name => existsSync(resolve(portable, name, "bin/java.exe")));
  if (folder) env.JAVA_HOME = resolve(portable, folder);
}
if (!env.ANDROID_HOME && process.platform === "win32") env.ANDROID_HOME = resolve(env.LOCALAPPDATA, "Android/Sdk");
const windows = process.platform === "win32";
const gradleArguments = ":app:assembleDebug --no-daemon --no-watch-fs --max-workers=1";
const child = spawn(windows ? "cmd.exe" : "./gradlew", windows ? ["/d", "/c", `gradlew.bat ${gradleArguments}`] : gradleArguments.split(" "), {
  cwd: resolve(root, "android"), env, stdio: "inherit",
});
child.on("error", error => { console.error(error.message); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
