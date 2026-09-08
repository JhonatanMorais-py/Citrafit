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
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível entrar agora.");

      applyUser(result.user);
      passwordInput.value = "";
      document.getElementById("loginScreen").classList.add("hidden");
      document.getElementById("appShell").classList.remove("hidden");
      window.showToast?.(`Bem-vindo, ${result.user.name}. Seu próximo treino está pronto.`);
    } catch (error) {
      loginStatus.textContent = error.message;
    } finally {
      loginButton.disabled = false;
      loginButton.textContent = "Entrar no app";
    }
  };

  loginButton.addEventListener("click", login);
})();
