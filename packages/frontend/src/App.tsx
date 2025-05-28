// src/App.tsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Global CSS
import './css/app.css';
import './css/nav-menu.css';
import './css/link-tab-container.css';
// import './css/net-worth.css';
import './css/sub-pages.css';
import './css/forms.page.css';

// Pages & Layout
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
// import CategoryFormPage from './pages/CategoryFormPage';
// import NetWorthPage from '../page/NetWorthPage';
// import NetWorthFormPage from '../page/NetWorthFormPage';
import LoginPage from './pages/LoginPage';

// Make this bigger and maybe sorting or something...
import { userData } from './mock/mockUserData';


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
        <Route element={<Layout userName={userData.name}/>}>          
          <Route path="home" element={<HomePage totalAmount={userData.totalAmount} totalAllotment={userData.totalAllotment}/>} />

          {/* Categories list and nested form */}
          <Route path="category/:slug" element={<CategoryPage/>} />
          {/*<Route path="category/:slug/category-form/:id" element={<CategoryFormPage />} /> */}

          {/* Net Worth list and nested form */}
          {/*
          <Route path="net-worth/" element={<NetWorthPage />} />  
          <Route path="net-worth/net-worth-form" element={<NetWorthFormPage />} />
          */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

