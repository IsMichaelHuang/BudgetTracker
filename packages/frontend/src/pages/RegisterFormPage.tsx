/**
 * @module RegisterFormPage
 * @description Registration form page component. Collects username, email,
 * password, and initial budget allotment. Calls the {@link register} API client,
 * stores the JWT, and redirects to the login page on success.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from "../api/credentials";


/** Props for the {@link RegisterFormPage} component. */
interface LoginFormPageProps {
  /** Callback to update the parent App's token state after successful registration. */
  onSetToken: (e: string) => void;
}

/**
 * Renders a registration form with fields for username, email, password,
 * and total budget allotment. On success, stores the JWT and navigates to `/login`.
 *
 * @param props - {@link LoginFormPageProps}
 */
function RegisterFormPage({ onSetToken }: LoginFormPageProps) {
  const [username, setUsername] = useState('');
  const [plainTextPassword, setPlainTextPassword] = useState('');
  const [email, setEmail] = useState('');
  const [totalAllotment, setTotalAllotment] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate(); // Hook for navigating

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !plainTextPassword || !email || !totalAllotment) {
      setError('Missing field(s)');
      return;
    }
    try {
      setError(null);
      const totalAmount = 0;
      const userData = { totalAmount, totalAllotment};
      const { token } = await register(username, email, plainTextPassword, userData);
      localStorage.setItem("token", token);
      onSetToken(token);
      navigate('/login', { replace: true });
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
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={plainTextPassword}
            onChange={e => setPlainTextPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="totalAllotment">TotalAllotment</label>
          <input
            type="number"
            id="totalAllotment"
            value={totalAllotment ?? ""}
            onChange={e => setTotalAllotment(parseFloat(e.target.value))}
            required
          />
        </div>

        <button type="submit" className="register-button">Create Account</button>
        <button type="button" onClick={() => window.history.back()}>Cancel</button>
      </form>
    </div>
  );
}
export default RegisterFormPage;
