import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
//import StartGame from './game/main';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

document.addEventListener('DOMContentLoaded', () => {
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    StartGame(gameContainer);
  }
});
