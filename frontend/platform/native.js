import { Capacitor, registerPlugin, SystemBars } from "@capacitor/core";
import { App } from "@capacitor/app";
window.Capacitor = Capacitor;
window.RunlifeNative = { vault: registerPlugin("SessionVault") };
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add("native-app");
  document.addEventListener("DOMContentLoaded", () => {
    const shell = document.getElementById("appShell");
    const updateBars = () => SystemBars.setStyle({ style: shell.classList.contains("hidden") ? "DARK" : "LIGHT" }).catch(() => {});
    new MutationObserver(updateBars).observe(shell, { attributes: true, attributeFilter: ["class"] });
    updateBars();
  });
  App.addListener("backButton", () => {
    const modal = document.getElementById("modalWrap");
    if (modal && !modal.classList.contains("hidden")) { modal.classList.add("hidden"); return; }
    if (!document.getElementById("registerScreen").classList.contains("hidden")) {
      document.getElementById("backToLoginBtn").click(); return;
    }
    if (!document.getElementById("appShell").classList.contains("hidden") &&
        !document.querySelector('[data-page="home"]').classList.contains("active")) {
      window.navigate("home"); return;
    }
    App.minimizeApp();
  });
}
