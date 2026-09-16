(() => {
  let user = null;

  const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2)
    .map(part => part[0]).join("").toUpperCase() || "CF";

  const applyUser = value => {
    user = value;
    document.querySelectorAll("[data-user-name]").forEach(element => { element.textContent = user.name; });
    document.querySelectorAll("[data-user-email]").forEach(element => { element.textContent = user.email; });
    document.querySelectorAll("[data-user-initials]").forEach(element => { element.textContent = initials(user.name); });
  };

  const addAccountPanel = () => {
    if ((location.hash || "#inicio") !== "#mais") return;
    const grid = document.querySelector(".settings-grid");
    if (!grid || grid.querySelector("[data-real-account]")) return;
    const panel = document.createElement("section");
    panel.className = "settings-card account-card";
    panel.dataset.realAccount = "";
    panel.innerHTML = `<h2>Sua conta</h2>
      <div class="settings-row"><span class="member-avatar" data-user-initials></span><span><strong data-user-name></strong><small data-user-email></small></span></div>
      <p class="muted small">Estes são os dados reais da conta autenticada. Os demais números e atividades exibidos nesta experiência são exemplos simulados.</p>
      <form class="account-form" data-profile-form>
        <label>Altura em centímetros<input name="height" type="number" min="80" max="250" step="1" required></label>
        <label>Peso atual em quilogramas<input name="weight" type="number" min="25" max="400" step="0.1" required></label>
        <button class="button secondary" type="submit">Salvar dados</button>
        <p class="small" data-profile-status role="status" aria-live="polite"></p>
      </form>
      <button class="button secondary" type="button" data-logout>Sair da conta</button>
      <p class="small" data-logout-status role="status" aria-live="polite"></p>`;
    grid.appendChild(panel);
    applyUser(user);
    panel.querySelector('[name="height"]').value = user.height ?? "";
    panel.querySelector('[name="weight"]').value = user.weight ?? "";
  };

  document.addEventListener("submit", async event => {
    const form = event.target.closest("[data-profile-form]");
    if (!form) return;
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector("[data-profile-status]");
    button.disabled = true;
    button.textContent = "Salvando";
    status.textContent = "";
    try {
      const result = await window.RunlifeApi.request("/api/perfil", {
        method: "PUT",
        body: JSON.stringify({ height: Number(form.elements.height.value), weight: Number(form.elements.weight.value) }),
      });
      user = { ...user, ...result.profile };
      status.textContent = result.message;
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
      button.textContent = "Salvar dados";
    }
  });

  document.addEventListener("click", async event => {
    const button = event.target.closest("[data-logout]");
    if (!button) return;
    const status = document.querySelector("[data-logout-status]");
    button.disabled = true;
    button.textContent = "Saindo";
    try {
      await window.RunlifeApi.logout();
      window.location.replace("../../");
    } catch (error) {
      if (status) status.textContent = error.message;
      button.disabled = false;
      button.textContent = "Sair da conta";
    }
  });

  window.addEventListener("hashchange", () => requestAnimationFrame(addAccountPanel));
  window.addEventListener("runlife:session-expired", () => window.location.replace("../../"));

  window.RunlifeApi.restore()
    .then(result => {
      applyUser(result.user);
      addAccountPanel();
      document.documentElement.classList.remove("auth-pending");
    })
    .catch(() => window.location.replace("../../"));
})();
