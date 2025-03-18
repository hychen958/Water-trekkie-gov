// models/GameState.js
const mongoose = require('mongoose');

const gameStateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  characterPosition: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  dropdownData: { type: Number, default: 0 },
  waterUsage: { type: Number, default: 0 },
  dailyLimit: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  clickCount: { type: Number, default: 0 },
  // 新增的角色欄位，儲存使用者選擇的角色資訊
  selectedCharacter: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('GameState', gameStateSchema);

