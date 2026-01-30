import { useEffect, useState } from "react";


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
          <input type="checkbox" checked={dark} onChange={() => setDark(d => !d)} />
        </label>

    );
};
export default DarkModeToggle;

