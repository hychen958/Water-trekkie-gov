// HelpScreen.jsx
import React from 'react';
import './App.css';

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
        {/* ❌ X Close Icon Button */}
        <button
          className="close-button"
          onClick={() => {
            playClickSound();
            onClose();
          }}
        >
          &times;
        </button>

        <h1 className="game-title">Welcome to the Water Trekkies!</h1>
        <p className="instructions">
          Your mission is to manage daily water consumption and stay within the allocated limit.
        </p>

        <h2 className="section-title">Purpose of the Game:</h2>
        <p>This is an educational and interactive game designed to raise awareness about responsible water usage. Players navigate a household environment, interact with various water-consuming appliances, and make daily choices to stay within their allocated water limit—based on real historical consumption data from Calgary.

By simulating real-life water usage behaviors and incorporating gamified decision-making, the game encourages players to develop habits that contribute to sustainable water consumption.

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
          <p>
            Use the <strong>arrow keys</strong> on your keyboard to move your character.
          </p>
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
      </div>
    </div>
  );
}

export default HelpScreen;
