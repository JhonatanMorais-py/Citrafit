(() => {
  const loginScreen = document.getElementById("loginScreen");
  const registerScreen = document.getElementById("registerScreen");
  const showRegisterButton = document.getElementById("showRegisterBtn");
  const backToLoginButton = document.getElementById("backToLoginBtn");
  const registerForm = document.getElementById("registerForm");
  const registerStatus = document.getElementById("registerStatus");

  if (!loginScreen || !registerScreen || !registerForm) return;

  const setScreen = (screen) => {
    const showRegister = screen === "register";
    loginScreen.classList.toggle("hidden", showRegister);
    registerScreen.classList.toggle("hidden", !showRegister);
    registerScreen.setAttribute("aria-hidden", String(!showRegister));
    document.title = showRegister ? "Criar conta | RUN/LIFE" : "RUN/LIFE";
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById(showRegister ? "registerName" : "emailInput")?.focus();
  };

  const showError = (field, message) => {
    field.setAttribute("aria-invalid", message ? "true" : "false");
    const error = registerForm.querySelector(`[data-error-for="${field.id}"]`);
    if (error) error.textContent = message;
  };

  const validateForm = () => {
    const name = document.getElementById("registerName");
    const email = document.getElementById("registerEmail");
    const password = document.getElementById("registerPassword");
    const confirmation = document.getElementById("registerPasswordConfirm");
    const privacy = document.getElementById("registerPrivacy");

    showError(name, name.value.trim().length >= 3 ? "" : "Informe seu nome completo.");
    showError(email, email.validity.valid ? "" : "Informe um e-mail válido.");
    showError(password, password.value.length >= 8 ? "" : "A senha deve ter pelo menos 8 caracteres.");
    showError(confirmation, confirmation.value && confirmation.value === password.value ? "" : "As senhas precisam ser iguais.");
    showError(privacy, privacy.checked ? "" : "Confirme os termos para continuar.");

    return [name, email, password, confirmation, privacy]
      .every((field) => field.getAttribute("aria-invalid") !== "true");
  };

  showRegisterButton?.addEventListener("click", () => setScreen("register"));
  backToLoginButton?.addEventListener("click", () => setScreen("login"));

  registerForm.addEventListener("input", (event) => {
    if (event.target.matches("input")) showError(event.target, "");
    registerStatus.textContent = "";
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    registerStatus.textContent = "";
    if (!validateForm()) {
      registerForm.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const submitButton = registerForm.querySelector('[type="submit"]');
    const email = document.getElementById("registerEmail").value.trim();
    submitButton.disabled = true;
    submitButton.textContent = "Criando conta";

    try {
      const response = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: document.getElementById("registerName").value.trim(),
          email,
          password: document.getElementById("registerPassword").value,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível criar sua conta.");

      registerForm.reset();
      registerStatus.textContent = result.message;
      document.getElementById("emailInput").value = email;
    } catch (error) {
      registerStatus.textContent = error.message;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Criar minha conta";
    }
  });
})();
