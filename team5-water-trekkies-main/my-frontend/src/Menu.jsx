import React from 'react';
import MusicPlayer from './MusicPlayer';
import { useNavigate } from 'react-router-dom';

const clickSound = new Audio('/sounds/click.mp3');
clickSound.volume = 0.5;

const playClickSound = () => {
  clickSound.currentTime = 0;
  clickSound.play();
};

const Menu = () => {
  const navigate = useNavigate();

  const handleClick = (buttonName) => {
    playClickSound(); // Play sound effect
    console.log(`${buttonName} clicked`);
    if (buttonName === 'Start Game') {
      navigate('/gametest');
    } else if (buttonName === 'Continue Game') {
      navigate('/gametest'); 
    } else if (buttonName === 'Settings') {
      navigate('/characterselect');
    } else if (buttonName === 'Help') {
      navigate('/helpscreen');
    } else if (buttonName === 'Log Out') {
      console.log('Logging out...');
      navigate('/login');
    } else if (buttonName === 'Quit') {
      navigate('/login'); // Navigate to the login page when Quit is clicked
    }
  };

  return (
    <div className="menu-screen">
      <MusicPlayer audioSrc="/music/Penn.mp3" />
      <div className="menu-container">
        <h1 className="menu-title">Main Menu</h1>

        <button
          className="menu-button"
          onClick={() => handleClick('Continue Game')}
        >
          Continue Game
        </button>
        <button
          className="menu-button"
          onClick={() => handleClick('Help')}
        >
          Help
        </button>
        {/* Add the Quit button below Help */}
        <button
          className="menu-button"
          onClick={() => handleClick('Quit')}
        >
          Quit
        </button>
      </div>
    </div>
  );
};

export default Menu;
