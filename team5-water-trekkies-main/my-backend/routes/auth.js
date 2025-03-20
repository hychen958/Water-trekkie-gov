const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // ✅ Ensure jwt is imported
const User = require('../models/User');

// ✅ Ensure login route exists
router.post('/login', async (req, res) => {
  try {
    console.log('Received Login Data:', req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ✅ Generate JWT Token (Ensure `process.env.JWT_SECRET` is set)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error in Login:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Ensure router is exported
module.exports = router;
