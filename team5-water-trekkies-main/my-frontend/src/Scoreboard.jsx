// src/Scoreboard.jsx
import React from 'react';
import './Scoreboard.css';

const Scoreboard = ({ waterUsage, dailyLimit, clickCount, score }) => {
  return (
    <div className="scoreboard">
      <h3 className="score-title">💧 Daily Water Report</h3>
      <p>🚿 Water Usage: <strong>{waterUsage}L</strong></p>
      <p>📈 Daily Limit: <strong>{dailyLimit}L</strong></p>
      <p>🖱️ Clicks Left: <strong>{10 - clickCount}</strong></p>
      <p>🏆 Score: <strong>{score}L</strong></p>
    </div>
  );
};

export default Scoreboard;
