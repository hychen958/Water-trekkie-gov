import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from './api';

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
          <button type="submit" className="submit-btn">Register</button>
        </form>
        <p>
          Already have an account?{' '}
          <button className="link-btn" onClick={() => navigate('/login')}>
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;

