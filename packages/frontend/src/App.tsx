import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';

// Global CSS
import './css/app.css';
import './css/nav-menu.css';
import './css/link-tab-container.css';
// import './css/net-worth.css';
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
// import NetWorthPage from '../page/NetWorthPage';
// import NetWorthFormPage from '../page/NetWorthFormPage';

import useSummary from "./hooks/useSummary";
import useSlugtify from "./hooks/useSlugtify"
import { getUserId } from "./api/credentials";



function App() {  
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [userId, setUserId] = useState<string | null>(null);

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
        {/*
        <Route path="net-worth/" element={<NetWorthPage />} />  
        <Route path="net-worth/net-worth-form" element={<NetWorthFormPage />} />
        */}
      </Route>
    </Routes>
  );
}
export default App;

