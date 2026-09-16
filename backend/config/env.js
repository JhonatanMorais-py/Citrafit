import "dotenv/config";

const requiredVariables = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missingVariables = requiredVariables.filter((name) => !process.env[name]);

if (missingVariables.length > 0) {
  throw new Error(
    `Variáveis de ambiente obrigatórias ausentes: ${missingVariables.join(", ")}`,
  );
}

export const env = Object.freeze({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  appPort: Number(process.env.APP_PORT || 3000),
  appHost: process.env.APP_HOST || "127.0.0.1",
  nativeOrigins: (process.env.NATIVE_ORIGINS || "https://localhost,capacitor://localhost").split(",").map(value => value.trim()).filter(Boolean),
});
