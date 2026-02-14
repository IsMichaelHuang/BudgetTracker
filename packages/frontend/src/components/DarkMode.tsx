/**
 * @module DarkMode
 * @description Toggle component for dark/light theme switching.
 * Persists the user's preference in `localStorage` under the key `"theme"`
 * and applies/removes a `"dark"` class on `document.body`.
 * Falls back to the OS-level `prefers-color-scheme` media query on first visit.
 */

import { useEffect, useState } from "react";


/**
 * Renders a labeled checkbox that toggles dark mode on/off.
 * Theme state is initialized from localStorage > OS preference > light default.
 */
function DarkModeToggle() {
  // Try to get theme from localStorage, or default to "light"
  const [dark, setDark] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") return true;
    if (stored === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (dark) {
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

    return (
        <label>
          Dark Mode
          <input type="checkbox" checked={dark} onClick={() => setDark(d => !d)} />
        </label>

    );
};
export default DarkModeToggle;
