import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", testMatch: "ui.spec.mjs", workers: 1,
  outputDir: "dist/ui-results", reporter: "list",
  use: { channel: "chrome", headless: true, baseURL: "http://127.0.0.1:3000" },
  webServer: {
    command: "node backend/server.js", url: "http://127.0.0.1:3000", reuseExistingServer: !process.env.CI,
    env: { SUPABASE_URL: "http://127.0.0.1:9", SUPABASE_SERVICE_ROLE_KEY: "ui-test-only", APP_PORT: "3000" },
  },
});
