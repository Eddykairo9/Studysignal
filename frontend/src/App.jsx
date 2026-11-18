import { lazy, Suspense, useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { api } from "./services/api.js";

const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const PredictionPage = lazy(() => import("./pages/PredictionPage.jsx"));

function NavigationLink({ to, children }) {
  return (
    <NavLink
      className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      to={to}
    >
      {children}
    </NavLink>
  );
}

function ApiStatus() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .health()
      .then((response) => {
        if (active) setHealth(response);
      })
      .catch(() => {
        if (active) setHealth({ status: "unavailable" });
      });
    return () => {
      active = false;
    };
  }, []);

  const text =
    health?.status === "ok"
      ? "API connected"
      : health
        ? "API unavailable"
        : "Checking API";
  return (
    <span className={`header-status${health?.status === "unavailable" ? " status-offline" : ""}`}>
      <span className="status-dot" /> {text}
    </span>
  );
}

export default function App() {
  const [theme, setTheme] = useState(
    () => window.localStorage.getItem("studysignal-theme") === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("studysignal-theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <NavLink aria-label="StudySignal home" className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">
              S
            </span>
            <span>
              <strong>StudySignal</strong>
              <small>ACADEMIC RESEARCH</small>
            </span>
          </NavLink>
          <button
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            aria-pressed={theme === "dark"}
            className="theme-toggle"
            onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
            type="button"
          >
            <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
            <span>{theme === "light" ? "Dark" : "Light"}</span>
          </button>
          <nav aria-label="Main navigation" className="main-nav">
            <NavigationLink to="/">Overview</NavigationLink>
            <NavigationLink to="/predict">Student check-in</NavigationLink>
            <NavigationLink to="/dashboard">Research dashboard</NavigationLink>
          </nav>
          <ApiStatus />
        </div>
      </header>

      <main>
        <Suspense fallback={<div aria-live="polite" className="loading-state">Loading page…</div>}>
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<PredictionPage />} path="/predict" />
            <Route element={<DashboardPage />} path="/dashboard" />
            <Route
              element={
                <section className="page-wrap not-found">
                  <p className="eyebrow">404 · NOT FOUND</p>
                  <h1>That page isn’t here.</h1>
                  <NavigationLink to="/">Return to overview</NavigationLink>
                </section>
              }
              path="*"
            />
          </Routes>
        </Suspense>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span>StudySignal · Student performance research prototype</span>
          <span>Predictions are estimates, not guarantees.</span>
        </div>
      </footer>
    </div>
  );
}
