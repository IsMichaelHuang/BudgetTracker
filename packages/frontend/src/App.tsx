/**
 * @module App
 * @description Root application component that orchestrates authentication state,
 * data fetching, and client-side routing.
 *
 * **Behavior:**
 * - **Unauthenticated**: Renders login and registration routes.
 * - **Authenticated**: Resolves the user's credential to a userId, fetches the
 *   financial summary via {@link useSummary}, and renders the protected route tree
 *   inside {@link Layout} with Header and Footer.
 * - The root `/` path redirects authenticated users to their slugified dashboard URL.
 *
 * **Route structure (authenticated):**
 * | Path | Component | Description |
 * |------|-----------|-------------|
 * | `/:username/:userId` | {@link UserPage} | Dashboard overview |
 * | `/:username/:userId/:category/:catId` | {@link CategoryPage} | Category detail |
 * | `/:username/:userId/:catId` | {@link CategoryFormPage} | Edit category |
 * | `/:username/:userId/category/new` | {@link CategoryFormPage} | New category |
 * | `/:username/:userId/:category/:catId/:chId` | {@link ChargeFormPage} | Edit charge |
 * | `/:username/:userId/:category/:catId/new` | {@link ChargeFormPage} | New charge |
 */

import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';

// Global CSS
import './css/app.css';
import './css/nav-menu.css';
import './css/link-tab-container.css';
import './css/net-worth.css';
import './css/sub-pages.css';
import './css/forms.page.css';

// Login & Register
import LoginFormPage from './pages/LoginFormPage';
import RegisterFormPage from "./pages/RegisterFormPage";

// Pages & Layout
import Layout from './components/Layout';
import UserPage from './pages/UserPage';
import CategoryPage from './pages/CategoryPage';
import CategoryFormPage from './pages/CategoryFormPage';
import ChargeFormPage from './pages/ChargeFormPage';
import NetWorthPage from './pages/NetWorthPage';
import NetWorthFormPage from './pages/NetWorthFormPage';

import useSummary from "./hooks/useSummary";
import useSlugtify from "./hooks/useSlugtify"
import { getUserId } from "./api/credentials";



function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [userId, setUserId] = useState<string | null>(null);

  // Redirect to login when token expires (fired by authFetch on 401)
  useEffect(() => {
    const handleExpired = () => {
      setToken(null);
      setUserId(null);
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

  // Get userId from the backend after login
  useEffect(() => {
    if (token && !userId) {
      getUserId().then(userId => {setUserId(userId)});
    }
  }, [token, userId]);

  const { summary, loading, error, refetch} = useSummary(userId, token);


  if (!token && !userId) {
    return (
      <Routes>
        <Route path="/*" element={< LoginFormPage onSetToken={setToken} />} />
        <Route path="/register" element={< RegisterFormPage onSetToken={setToken} />} />
      </Routes>
    );
  }

  if (loading) return <div>Loading User data....</div>;
  if (error) return <div>Error: {error}</div>;
  if(!summary) return <div>No user found</div>;

  return (
    <Routes>
      {/* Public login route */}
      <Route path="/" element={
        <Navigate
          to={`/${useSlugtify(summary.user.name)}/${summary.user._id}`}
          replace
        />
      } />

      {/* Private area under Layout */}
      <Route element={<Layout username={summary.user.name}/>}>
        <Route path="/:username/:userId" element={<UserPage summaryData={summary} />} />

        <Route
          path="/:username/:userId/:category/:catId"
          element={<CategoryPage summaryData={summary} />}
        />

        {/* Forms */}
        <Route
          path="/:username/:userId/:catId"
          element={<CategoryFormPage summaryData={summary} refetch={refetch}/>}
        />
        <Route
          path="/:username/:userId/category/new"
          element={<CategoryFormPage summaryData={summary} refetch={refetch}/>}
        />

        <Route
          path="/:username/:userId/:category/:catId/:chId"
          element={<ChargeFormPage summaryData={summary} refetch={refetch}/>}
        />
        <Route
          path="/:username/:userId/:category/:catId/new"
          element={<ChargeFormPage summaryData={summary} refetch={refetch}/>}
        />

        {/* Net Worth list and nested form */}
        <Route path="/net-worth" element={<NetWorthPage userId={summary.user._id} token={token} />} />
        <Route path="/net-worth/new" element={<NetWorthFormPage userId={summary.user._id} refetch={refetch} />} />
        <Route path="/net-worth/:nwId" element={<NetWorthFormPage userId={summary.user._id} refetch={refetch} />} />
      </Route>
    </Routes>
  );
}
export default App;
