import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MusicPlayer from './MusicPlayer';
import { registerUser } from './api';

const clickSound = new Audio('/sounds/click.mp3');
clickSound.volume = 0.5;

const playClickSound = () => {
  clickSound.currentTime = 0;
  clickSound.play();
};

const Register = () => {
  const [formData, setFormData] = useState({ FullName: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await registerUser(formData);
    if (result.message) {
      alert(result.message);
      navigate('/login');
    } else {
      alert('Error registering user');
    }
  };

  return (
    <div className="register-screen">
      <MusicPlayer audioSrc="/music/Daybreak.mp3" />
      <div className="form-container">
        <h1 className="title">Register</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="FullName"
            placeholder="Full Name"
            value={formData.FullName}
            onChange={handleChange}
          />
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
          <button type="submit" className="submit-btn"onClick={playClickSound}>Register</button>
        </form>
        <p>
          Already have an account?{' '}
          <button className="link-btn" onClick={() =>  { playClickSound(); navigate('/login'); }}>
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;

