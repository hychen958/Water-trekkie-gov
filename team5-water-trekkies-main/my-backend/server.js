// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware configuration
app.use(cors());
app.use(bodyParser.json());

// connect MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// --- Original User Schema and API --- //

// User Schema
const userSchema = new mongoose.Schema({
  FullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

// Encrypt password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

// register API
app.post('/api/register', async (req, res) => {
  const { FullName, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new User({ FullName, email, password });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ligin API
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Game state save and load functionality --- //

// Define a schema for storing game data (referencing models/GameState.js)
const GameState = require('./models/GameState');

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Failed to authenticate token' });
    req.userId = decoded.id;
    next();
  });
};

// API for saving game state
app.post('/api/game/save', verifyToken, async (req, res) => {
  // Read all data from the request, including the newly added selectedCharacter
  const { dailyLimit, waterUsage, clickCount, score, characterPosition, dropdownData, selectedCharacter } = req.body;
  try {
    let gameState = await GameState.findOne({ user: req.userId });
    if (gameState) {
      // Update existing record
      gameState.dailyLimit = dailyLimit;
      gameState.waterUsage = waterUsage;
      gameState.clickCount = clickCount;
      gameState.score = score;
      gameState.characterPosition = characterPosition;
      gameState.dropdownData = dropdownData;
      gameState.selectedCharacter = selectedCharacter;
      await gameState.save();
    } else {
      // Create a new game state record
      gameState = new GameState({
        user: req.userId,
        dailyLimit,
        waterUsage,
        clickCount,
        score,
        characterPosition,
        dropdownData,
        selectedCharacter
      });
      await gameState.save();
    }
    res.json({ message: 'Game state saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// API for loading game state
app.get('/api/game/load', verifyToken, async (req, res) => {
  try {
    const gameState = await GameState.findOne({ user: req.userId });
    if (!gameState) {
      return res.status(404).json({ message: 'No game state found' });
    }
    res.json(gameState);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
