/**
 * @module main
 * @description Frontend entry point. Mounts the React application into the DOM.
 * Wraps {@link App} in a `<BrowserRouter>` to enable client-side routing
 * via React Router DOM.
 */

import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./main.css";

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
