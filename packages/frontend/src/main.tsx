import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";

// Global CSS
import "./main.css";
import './css/app.css';
import './css/nav-menu.css';
import './css/link-tab-container.css';
import './css/sub-pages.css';
import './css/forms.page.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>,
)
