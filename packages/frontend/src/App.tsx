import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';

// Login & Register
import LoginFormPage from './pages/LoginFormPage';
import RegisterFormPage from "./pages/RegisterFormPage";

// Pages & Layout
import Layout from './components/Layout';
import Loading from './components/Loading';
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
      getUserId()
        .then(userId => {
          setUserId(userId);
        })
        .catch((err) => {
          console.error('Failed to get userId:', err);
          // Clear invalid token
          localStorage.removeItem('token');
          setToken(null);
          setUserId(null);
        });
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

  if (loading) return <Loading message="Loading user data..." />;
  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#c00' }}>
      <h2>Error</h2>
      <p>{error}</p>
    </div>
  );
  if(!summary) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>No user found</p>
    </div>
  );

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

