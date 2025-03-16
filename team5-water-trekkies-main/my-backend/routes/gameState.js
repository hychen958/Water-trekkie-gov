// routes/gameState.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const GameState = require('../models/GameState');

// 驗證 JWT 的 middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Failed to authenticate token' });
    req.userId = decoded.id;
    next();
  });
};

// 儲存遊戲狀態
router.post('/save', verifyToken, async (req, res) => {
  const { dailyLimit, waterUsage, clickCount, score, characterPosition, dropdownData } = req.body;
  try {
    let gameState = await GameState.findOne({ user: req.userId });
    if (gameState) {
      // 更新現有紀錄
      gameState.dailyLimit = dailyLimit;
      gameState.waterUsage = waterUsage;
      gameState.clickCount = clickCount;
      gameState.score = score;
      gameState.characterPosition = characterPosition;
      gameState.dropdownData = dropdownData;
      await gameState.save();
    } else {
      // 建立新的遊戲狀態紀錄
      gameState = new GameState({
        user: req.userId,
        dailyLimit,
        waterUsage,
        clickCount,
        score,
        characterPosition,
        dropdownData,
      });
      await gameState.save();
    }
    res.json({ message: 'Game state saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 載入遊戲狀態
router.get('/load', verifyToken, async (req, res) => {
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

module.exports = router;
