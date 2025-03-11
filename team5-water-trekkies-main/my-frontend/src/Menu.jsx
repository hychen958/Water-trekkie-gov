import React from 'react';
import { useNavigate } from 'react-router-dom';

const Menu = () => {
  const navigate = useNavigate();

  const handleClick = (buttonName) => {
    console.log(`${buttonName} clicked`);
    if (buttonName === 'Start Game' || buttonName === 'Continue Game') {
      navigate('/gametest');
    } else if (buttonName === 'Settings') {
      navigate('/characterselect');
    } else if (buttonName === 'Help') {
      navigate('/helpscreen');
    } else if (buttonName === 'Log Out') {
      console.log('Logging out...');
      navigate('/login');
    }
  };

  return (
    <div className="menu-screen">
      {/* Log Out Button in the Top Right Corner */}
      <div className="logout-button-container">
        <button
          className="logout-button"
          onClick={() => handleClick('Log Out')}
        >
          Log Out
        </button>
      </div>

      <div className="menu-container">
        <h1 className="menu-title">Main Menu</h1>
        <button
          className="menu-button"
          onClick={() => handleClick('Start Game')}
        >
          Start Game
        </button>
        <button
          className="menu-button"
          onClick={() => handleClick('Help')}
        >
          Help
        </button>
      </div>
    </div>
  );
};

export default Menu;





