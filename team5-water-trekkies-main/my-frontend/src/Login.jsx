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

  // 恢復未登入的 Try the Game 功能：試玩模式設定 isLoggedIn 為 false
  const handleTryGame = () => {
    const characters = [
      { id: 1, name: 'Adam', imgSrc: './images/char1.jpg' },
      { id: 2, name: 'Alex', imgSrc: '/images/char2.jpg' },
      { id: 3, name: 'Amelia', imgSrc: '/images/char3.jpg' },
      { id: 4, name: 'Bob', imgSrc: '/images/char4.jpg' },
    ];
    const randomIndex = Math.floor(Math.random() * characters.length);
    const randomCharacter = characters[randomIndex];
    navigate('/gametest', { state: { selectedCharacter: randomCharacter, isLoggedIn: false } });
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
          <button className="link-btn" onClick={handleTryGame}>
            Try the Game
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

