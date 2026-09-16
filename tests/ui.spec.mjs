import { test, expect } from "@playwright/test";

test("public Web entry always shows login even when a previous session exists", async ({ page }) => {
  let sessionRequests = 0;
  await page.route("**/api/sessao", async route => {
    sessionRequests++;
    await route.fulfill({ status: 200, json: { user: { name: "Sessão anterior", email: "anterior@example.com" } } });
  });
  await page.goto("/");
  await expect(page.locator("#loginScreen")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  expect(sessionRequests).toBe(0);
});

test("direct app entry redirects to login without an authenticated session", async ({ page }) => {
  await page.route("**/api/**", route => route.fulfill({ status: 401, json: { error: "Entre novamente." } }));
  await page.goto("/frontend/app/index.html");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("#loginScreen")).toBeVisible();
});

for (const width of [360, 1280]) {
  test(`login, registration, profile and logout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    let authenticated = false;
    let registrationCalls = 0;
    const user = { name: "Pessoa de Teste", email: "pessoa@example.com", height: 175, weight: 72 };
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/api/**", async route => {
      const path = new URL(route.request().url()).pathname;
      let status = 200; let body;
      if (path === "/api/login") { authenticated = true; body = { user }; }
      else if (path === "/api/cadastro") { registrationCalls++; body = { message: "Conta criada com sucesso." }; }
      else if (path === "/api/logout") { authenticated = false; body = { remoteFailed: false }; }
      else if (path === "/api/perfil") body = { profile: { height: 180, weight: 80 }, message: "Dados atualizados com sucesso." };
      else if (authenticated) body = { user };
      else { status = 401; body = { error: "Entre novamente." }; }
      await route.fulfill({ status, json: body });
    });
    await page.goto("/");
    await expect(page.locator("#loginBtn")).toBeEnabled();
    await expect(page.locator("#loginBtn")).toHaveCSS("background-color", "rgb(198, 255, 61)");
    await expect(page.locator(".login-card .brand-mark")).toContainText("CITRA");
    await page.screenshot({ path: `dist/ui-results/login-${width}.png`, fullPage: true });
    await page.locator("#showRegisterBtn").click();
    await expect(page.locator("#registerForm")).toBeVisible();
    await page.locator("#registerName").fill(user.name);
    await page.locator("#registerEmail").fill(user.email);
    await page.locator("#registerPassword").fill("test-password");
    await page.locator("#registerPasswordConfirm").fill("test-password");
    await page.locator("#registerPrivacy").check();
    await page.locator('#registerForm [type="submit"]').click();
    await expect(page.locator('[data-error-for="registerPassword"]')).toContainText("letra maiúscula");
    expect(registrationCalls).toBe(0);
    await page.locator("#registerPassword").fill("Test-password!");
    await page.locator("#registerPasswordConfirm").fill("Test-password!");
    await page.locator('#registerForm [type="submit"]').click();
    await expect(page.locator("#registerStatus")).toHaveText("Conta criada com sucesso.");
    expect(registrationCalls).toBe(1);
    await page.locator("#backToLoginBtn").click();
    await page.locator("#emailInput").fill(user.email);
    await page.locator("#passwordInput").fill("test-password");
    await page.locator("#loginBtn").click();
    await expect(page).toHaveURL(/frontend\/app\/index\.html/);
    await expect(page.locator("#main")).toBeVisible();
    const nav = width < 900 ? "#mobile-nav" : "#desktop-nav";
    for (const key of ["feed", "eventos", "mais"]) {
      await page.locator(`${nav} [data-nav="${key}"]`).click();
      await expect(page.locator("#main .page-heading")).toBeVisible();
    }
    if (width >= 900) {
      await expect(page.locator(`${nav} [data-nav="mais"]`)).toHaveCSS("background-color", "rgb(198, 255, 61)");
      const navigationIconX = await page.locator(`${nav} [data-nav="mais"] svg`).evaluate(element => element.getBoundingClientRect().x);
      const affiliateIconX = await page.locator(".affiliate-link svg").evaluate(element => element.getBoundingClientRect().x);
      expect(affiliateIconX).toBe(navigationIconX);
      const mainOutline = await page.locator("#main").evaluate(element => {
        element.focus();
        return getComputedStyle(element).outlineStyle;
      });
      expect(mainOutline).toBe("none");
    }
    await page.locator('[name="height"]').fill("180");
    await page.locator('[name="weight"]').fill("80");
    await page.locator("[data-profile-form]").evaluate(form => form.requestSubmit());
    await expect(page.locator("[data-profile-status]")).toHaveText("Dados atualizados com sucesso.");
    await page.screenshot({ path: `dist/ui-results/profile-${width}.png`, fullPage: true });
    await page.reload();
    await expect(page.locator("#main")).toBeVisible();
    await page.locator(`${nav} [data-nav="mais"]`).click();
    await page.locator("[data-logout]").click();
    await expect(page.locator("#loginScreen")).toBeVisible();
    expect(errors).toEqual([]);
  });
}
