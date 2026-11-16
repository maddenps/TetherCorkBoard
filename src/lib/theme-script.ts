/** Runs before first paint so there is no light flash in dark mode. Kept out of the client module so layout.tsx can import it. */
export const THEME_STORAGE_KEY = "tethercorkboard:theme";

export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(!t){t="dark"}if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`;
