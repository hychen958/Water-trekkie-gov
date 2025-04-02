// Menu.jsx
import React, { useState } from 'react';
import MusicPlayer from './MusicPlayer';
import { useNavigate } from 'react-router-dom';
import HelpScreen from './HelpScreen';

const clickSound = new Audio('/sounds/click.mp3');
clickSound.volume = 0.5;
const playClickSound = () => {
  clickSound.currentTime = 0;
  clickSound.play();
};

const Menu = () => {
  const [showHelp, setShowHelp] = useState(false);
  const navigate = useNavigate();

  const handleClick = (buttonName) => {
    playClickSound();
    if (buttonName === 'Start Game') {
      navigate('/gametest');
    } else if (buttonName === 'Continue Game') {
      navigate('/gametest');
    } else if (buttonName === 'Settings') {
      navigate('/characterselect');
    } else if (buttonName === 'Help') {
      setShowHelp(true); // open help popup
    } else if (buttonName === 'Log Out' || buttonName === 'Quit') {
      navigate('/login');
    }
  };

  return (
    <div className="menu-screen">
      <MusicPlayer audioSrc="/music/Penn.mp3" />
      <div className="menu-container">
        <h1 className="menu-title">Main Menu</h1>

        <button className="menu-button" onClick={() => handleClick('Continue Game')}>
          Continue Game
        </button>
        <button className="menu-button" onClick={() => handleClick('Help')}>
          Help
        </button>
        <button className="menu-button" onClick={() => handleClick('Quit')}>
          Quit
        </button>
      </div>

      {showHelp && <HelpScreen onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default Menu;
