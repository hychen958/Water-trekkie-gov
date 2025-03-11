import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from './api';

const Login = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await loginUser(formData);
    if (result.token) {
      localStorage.setItem('token', result.token);
      setIsAuthenticated(true);
      navigate('/menu');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="login-screen">
      <div className="form-container">
        <h1 className="title">Login</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          <button type="submit" className="submit-btn">
            Login
          </button>
        </form>
        <p>
          New user?{' '}
          <button className="link-btn" onClick={() => navigate('/register')}>
            Register here
          </button>
        </p>
        <p>
          Curious?{' '}
          <button className="link-btn" onClick={() => navigate('/gametest')}>
            Try the Game
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

//research popup in react and be able to setup a new user screen//