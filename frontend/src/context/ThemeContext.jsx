import { createContext, useContext, useState, useEffect, useCallback } from "react";

var ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  var [dark, setDark] = useState(function () {
    try { return localStorage.getItem("html-viewer-theme") === "dark"; }
    catch (e) { return false; }
  });

  useEffect(function () {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("html-viewer-theme", dark ? "dark" : "light"); }
    catch (e) { /* noop */ }
  }, [dark]);

  var toggle = useCallback(function () { setDark(function (d) { return !d; }); }, []);

  return (
    <ThemeContext.Provider value={{ dark: dark, toggle: toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  var ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
