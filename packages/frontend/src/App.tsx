// src/App.tsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Global CSS
import './css/app.css';
import './css/nav-menu.css';
import './css/link-tab-container.css';
import './css/networth.css';
import './css/subpages.css';
import './css/forms.page.css';

// Pages & Layout
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import CategoryFormPage from './pages/CategoryFormPage';
import NetWorthPage from './pages/NetWorthPage';
import NetWorthFormPage from './pages/NetWorthFormPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = (): void => setLoggedIn(true);

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login */}
        <Route path="/" element={loggedIn ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />

        {/* Public login route */}
        <Route path="/login" element={loggedIn ? <Navigate to="/home" replace /> : <LoginPage onToggle={handleLogin}/>} />

        {/* Private area under Layout */}
        <Route element={<Layout />}>          
          <Route path="home" element={<HomePage/>} />

          {/* Categories list and nested form */}
          <Route path="category/:id" element={<CategoryPage/>} />
          <Route path="category/:id/category-form" element={<CategoryFormPage />} />

          {/* Net Worth list and nested form */}
          <Route path="net-worth/" element={<NetWorthPage />} />  
          <Route path="net-worth/net-worth-form" element={<NetWorthFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

