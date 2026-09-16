(() => {
  const loginButton = document.getElementById("loginBtn");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const loginStatus = document.getElementById("loginStatus");

  if (!loginButton || !emailInput || !passwordInput || !loginStatus) return;

  const getInitials = (name) => name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const applyUser = (user) => {
    document.querySelectorAll("[data-user-name]").forEach((element) => {
      element.textContent = user.name;
    });
    document.querySelectorAll("[data-user-initials]").forEach((element) => {
      element.textContent = getInitials(user.name);
    });
    document.querySelectorAll("[data-user-name-input]").forEach((element) => {
      element.value = user.name;
    });
    document.querySelectorAll("[data-user-email-input]").forEach((element) => {
      element.value = user.email;
    });
    document.querySelectorAll("[data-user-email]").forEach((element) => {
      element.textContent = user.email;
    });
    window.dispatchEvent(new CustomEvent("runlife:user-authenticated", { detail: user }));
  };

  const login = async () => {
    if (loginButton.disabled) return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    loginStatus.textContent = "";

    if (!emailInput.validity.valid || !email || !password) {
      loginStatus.textContent = "Informe seu e-mail e sua senha.";
      return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Entrando";

    try {
      const result = await window.RunlifeApi.login({ email, password });

      applyUser(result.user);
      passwordInput.value = "";
      window.location.assign("frontend/app/index.html");
    } catch (error) {
      loginStatus.textContent = error.message;
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = "Entrar no app";
    }
  };

  loginButton.addEventListener("click", login);
  window.addEventListener("runlife:session-expired", () => {
    document.getElementById("appShell").classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("profileForm").reset();
    document.querySelectorAll("[data-user-name],[data-user-email],[data-user-initials]").forEach(element => { element.textContent = ""; });
    loginStatus.textContent = "Sua sessão expirou. Entre novamente.";
  });
  // Defer until all deferred profile listeners have been registered.
  document.addEventListener("DOMContentLoaded", async () => {
    // On the Web, opening the public address must always present the login
    // screen. Native apps may still restore their protected persisted session.
    if (window.Capacitor?.isNativePlatform() !== true) return;
    loginButton.disabled = true;
    try {
      const result = await window.RunlifeApi.restore();
      applyUser(result.user);
      window.location.assign("frontend/app/index.html");
    } catch (error) {
      loginStatus.textContent = error.status === 401 ? "" : error.message;
    } finally { loginButton.disabled = false; }
  });
})();
