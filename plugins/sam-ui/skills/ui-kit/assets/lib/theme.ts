/** Name of the localStorage item that holds the theme choice. Light is the default; "dark" opts in. */
export const THEME_STORAGE_ITEM = "sam-ui-theme";

/** Inlined in the root layout's <head>, so a saved dark choice applies before the first paint. */
export const THEME_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_ITEM}")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

/** useSyncExternalStore subscriber: calls back when <html>'s class (the .dark switch) changes. */
export function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributeFilter: ["class"],
    attributes: true,
  });
  return () => observer.disconnect();
}
