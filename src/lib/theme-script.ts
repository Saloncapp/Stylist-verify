/** Inline script injected in <head> to prevent theme flash (React 19 safe). */
export const themeInitScript = `(function(){try{var k='theme';var t=localStorage.getItem(k)||'light';var d=document.documentElement;var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;d.classList.add(r);d.style.colorScheme=r;}catch(e){}})();`;
