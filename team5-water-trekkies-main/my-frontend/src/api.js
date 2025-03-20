const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-production-api.com'
  : 'http://localhost:5000';

export const registerUser = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  } catch (error) {
    console.error('Registration Error:', error.message);
    throw error;
  }
};

export const loginUser = async (data) => {
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  } catch (error) {
    console.error('Login Error:', error.message);
    throw error;
  }
};
