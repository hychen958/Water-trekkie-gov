import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from './api';
import MusicPlayer from './MusicPlayer';


const Login = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await loginUser(formData);
      if (result.token) {
        localStorage.setItem('token', result.token);
        setIsAuthenticated(true);
        // After a successful login, try to load the user's game state
        const response = await fetch('http://localhost:5000/api/game/load', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + result.token
          }
        });
        // If the game state is not found (404), treat it as a new user and redirect to the character selection page
        if (response.status === 404) {
          navigate('/characterselect');
        } else {
          // If a game state already exists, redirect to the main menu
          navigate('/menu');
        }
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Error during login: ', error);
      alert('Error during login');
    }
  };

  // Keep the logic of the trial mode unchanged
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
       <MusicPlayer audioSrc="/music/Daybreak.mp3" />
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
