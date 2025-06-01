// src/App.tsx
import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Global CSS
import './css/app.css';
import './css/nav-menu.css';
import './css/link-tab-container.css';
// import './css/net-worth.css';
import './css/sub-pages.css';
import './css/forms.page.css';

// Pages & Layout
import Layout from './components/Layout';
import UserPage from './pages/UserPage';
import CategoryPage from './pages/CategoryPage';
// import CategoryFormPage from './pages/CategoryFormPage';
// import NetWorthPage from '../page/NetWorthPage';
// import NetWorthFormPage from '../page/NetWorthFormPage';
import LoginPage from './pages/LoginPage';

// User Documents
import { useSummary } from "./hooks/useSummary";
import type { SummaryType } from "./types/summaryType";


function App() { 
  const [loggedIn, setLoggedIn] = useState(false);
  const handleLogin = (): void => setLoggedIn(true);
 
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryType | null>(null);

  const userId = "60a1f2c3e7a9d1234567890b";

  useSummary(userId, {
    onStart: (() => {
      setError(null);
      setLoading(true);
    }),
    onSuccess: ((userData) => {
      setSummary(userData);
      setLoading(false);
    }),
    onError: ((message) => {
      setError(message);
      setLoading(false);
    })
  });

  if (!loggedIn) {
    return <LoginPage onToggle={handleLogin}/>;
  }

  if (loading) {
    return <div>Loading User data....</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if(!summary){
    return <div>No user found</div>
  }

  return (
    <Routes>
      {/* Public login route */}
      <Route path="/" element={<Navigate to="/user" replace />} />

      {/* Private area under Layout */}
      <Route element={<Layout username={summary.user.name}/>}>          
        <Route path="/user" element={<UserPage summaryData={summary}/>} />

        {/* Categories list and nested form */}
        <Route path="/category/:slug/:id" element={<CategoryPage/>} />
        {/*<Route path="category/:slug/category-form/:id" element={<CategoryFormPage />} /> */}

        {/* Net Worth list and nested form */}
        {/*
        <Route path="net-worth/" element={<NetWorthPage />} />  
        <Route path="net-worth/net-worth-form" element={<NetWorthFormPage />} />
        */}
      </Route>
    </Routes>
  );
}
export default App;

