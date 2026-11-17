/* PetCARE — Application entry point */
(async function boot(){
  const bundled = new URLSearchParams(location.search).get("bundled") === "1";
  if(!bundled) await AuthService.restore(); // bundled mode starts instantly; Connect opens the server-backed app
  else clearLocalData();
  if(!AuthService.getCurrentUser()){
    await hydratePublic();
    const publicRoute = /^#\/(home|login|signup)$/.exec(location.hash || "");
    if(publicRoute) UI.authScreen = publicRoute[1] === "home" ? "landing" : publicRoute[1];
    else if(isMobileAppMode()) UI.authScreen = "landing";
  }
  applyHashRoute();
  render();
  window.addEventListener("hashchange", () => { applyHashRoute(); render(); });
})();
