// HelpScreen.jsx
import React from 'react';
import './Gametest.css';

const clickSound = new Audio('/sounds/click.mp3');
clickSound.volume = 0.5;
const playClickSound = () => {
  clickSound.currentTime = 0;
  clickSound.play();
};

function HelpScreen({ onClose }) {
  return (
    <div className="trial-popup-overlay">
      <div className="trial-popup help-screen">
        <h1 className="game-title">Welcome to the Water Conservation Game!</h1>
        <p className="instructions">
          Your mission is to manage daily water consumption and stay within the allocated limit.
        </p>
        <h2 className="section-title">Key Game Rules:</h2>
        <ul className="game-rules">
          <li>You start with a daily water limit, based on average consumption data.</li>
          <li>Move your character to interact with household objects.</li>
          <li>Each interaction represents a water usage activity.</li>
          <li>Try to minimize water usage by making efficient choices.</li>
          <li>If your total water usage exceeds the daily limit, you lose the game.</li>
          <li>Complete all interactions without exceeding the limit to win!</li>
        </ul>
        <h2 className="section-title">Navigation Controls:</h2>
        <ul className="navigation-controls">
          <li>
            Use the <strong>arrow keys</strong> on your keyboard to move your character.
          </li>
        </ul>

        <table className="water-usage-table">
          <thead>
            <tr>
              <th>Water Use Behavior</th>
              <th>Water Consumption (Liters)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Tap (per minute)</td><td>12</td></tr>
            <tr><td>Low-flow toilet</td><td>6</td></tr>
            <tr><td>Low-flow showerhead (5 mins)</td><td>40</td></tr>
            <tr><td>Typical bathtub</td><td>80</td></tr>
            <tr><td>Dishwasher</td><td>35</td></tr>
            <tr><td>Front-load washing machine</td><td>65</td></tr>
            <tr><td>Watering lawn</td><td>950</td></tr>
          </tbody>
        </table>

        <div className="main-menu-button-container">
          <button
            className="main-menu-button"
            onClick={() => {
              playClickSound();
              onClose();
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpScreen;
