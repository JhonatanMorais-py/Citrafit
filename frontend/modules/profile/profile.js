(() => {
  const form = document.getElementById("profileForm");
  const heightInput = document.getElementById("profileHeight");
  const weightInput = document.getElementById("profileWeight");
  const saveButton = document.getElementById("saveProfileBtn");
  const status = document.getElementById("profileStatus");
  const logoutButton = document.getElementById("logoutBtn");

  if (!form || !heightInput || !weightInput || !saveButton || !status) return;

  window.addEventListener("runlife:user-authenticated", (event) => {
    const { height, weight } = event.detail;
    heightInput.value = height ?? "";
    weightInput.value = weight ?? "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";

    if (!form.reportValidity()) return;

    saveButton.disabled = true;
    saveButton.textContent = "Salvando";

    try {
      const response = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          height: Number(heightInput.value),
          weight: Number(weightInput.value),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar seus dados.");

      heightInput.value = result.profile.height;
      weightInput.value = result.profile.weight;
      status.textContent = result.message;
    } catch (error) {
      status.textContent = error.message;
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Salvar dados";
    }
  });

  logoutButton?.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Saindo";

    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) throw new Error("Não foi possível encerrar a sessão.");

      form.reset();
      document.querySelectorAll("[data-user-name]").forEach((element) => {
        element.textContent = "Usuário";
      });
      document.querySelectorAll("[data-user-initials]").forEach((element) => {
        element.textContent = "U";
      });
      document.querySelectorAll("[data-user-email]").forEach((element) => {
        element.textContent = "";
      });
      document.getElementById("appShell").classList.add("hidden");
      document.getElementById("loginScreen").classList.remove("hidden");
      document.getElementById("emailInput").focus();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      logoutButton.disabled = false;
      logoutButton.textContent = "Sair da conta";
    }
  });
})();
