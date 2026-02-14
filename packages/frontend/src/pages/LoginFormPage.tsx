/**
 * @module LoginFormPage
 * @description Login form page component. Collects username and password,
 * authenticates via the {@link login} API client, persists the JWT in
 * `localStorage`, and redirects to the home dashboard on success.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from "../api/credentials";


/** Props for the {@link LoginFormPage} component. */
interface LoginFormPageProps {
  /** Callback to update the parent App's token state after successful login. */
  onSetToken: (e: string) => void;
}

/**
 * Renders a login form with username/password fields.
 * On successful authentication, stores the JWT and navigates to `/`.
 *
 * @param props - {@link LoginFormPageProps}
 */
function LoginFormPage({ onSetToken }: LoginFormPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // Hook for navigating

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    try {
      setError(null);
      const { token } = await login(username, password);
      localStorage.setItem("token", token);
      onSetToken(token);
      navigate('/', { replace: true });
    } catch (err) {
      setError('Login failed—please check your credentials.');
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <p className="error-message">{error}</p>}

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="login-button">Sign In</button>
        <Link to="/register">
          <button type="button">
            Create Account
          </button>
        </Link>
      </form>
    </div>
  );
}
export default LoginFormPage;
