(() => {
  const native = () => window.Capacitor?.isNativePlatform() === true;
  let token = null;
  let refreshing = null;
  const vault = () => window.RunlifeNative?.vault;
  const base = () => {
    const url = window.RUNLIFE_CONFIG?.apiBaseUrl || "";
    if (native() && !url) throw new Error("O aplicativo ainda não está conectado ao servidor. Solicite uma versão configurada.");
    return url;
  };
  async function raw(path, options = {}) {
    const headers = { ...options.headers };
    if (options.body) headers["Content-Type"] = "application/json";
    if (native()) {
      headers["X-Runlife-Client"] = "native";
      if (token) headers.Authorization = `Bearer ${token}`;
    }
    let response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      response = await fetch(base() + path, { ...options, headers,
        credentials: native() ? "omit" : "same-origin", signal: controller.signal });
    } catch (error) {
      if (native() && !window.RUNLIFE_CONFIG?.apiBaseUrl) throw error;
      throw new Error("Não foi possível conectar. Verifique sua conexão e tente novamente.");
    } finally { clearTimeout(timeout); }
    const result = await response.json().catch(() => ({ error: "Resposta inválida do servidor." }));
    if (!response.ok) throw Object.assign(new Error(result.error || "Não foi possível concluir."), { status: response.status });
    return result;
  }
  async function save(result) {
    if (native() && result.session) {
      await vault().set({ value: result.session.refreshToken });
      token = result.session.accessToken;
    }
    return result;
  }
  async function clear() {
    token = null;
    if (native()) await vault().clear();
  }
  async function refresh() {
    if (!refreshing) refreshing = (async () => {
      const refreshToken = native() ? (await vault().get()).value : undefined;
      if (native() && !refreshToken) throw Object.assign(new Error("Entre novamente."), { status: 401 });
      return save(await raw("/api/sessao/renovar", { method: "POST", body: JSON.stringify({ refreshToken }) }));
    })().catch(async error => {
      if (error.status === 401) { await clear(); window.dispatchEvent(new Event("runlife:session-expired")); }
      throw error;
    }).finally(() => { refreshing = null; });
    return refreshing;
  }
  async function request(path, options) {
    try { return await raw(path, options); }
    catch (error) {
      if (error.status !== 401) throw error;
      await refresh();
      return raw(path, options);
    }
  }
  window.RunlifeApi = {
    request,
    login: async payload => save(await raw("/api/login", { method: "POST", body: JSON.stringify(payload) })),
    register: payload => raw("/api/cadastro", { method: "POST", body: JSON.stringify(payload) }),
    restore: async () => native() ? refresh() : request("/api/sessao"),
    logout: async () => {
      let result;
      try { result = await request("/api/logout", { method: "POST" }); }
      catch (error) {
        if (!native()) throw error;
        result = { remoteFailed: true };
      }
      await clear();
      return result;
    },
  };
})();
