// Display three pre-made character options.
// Provide a "Customize" button for each character to open customization options.
// Customization options include:
// Hair: Dropdown or icon selection for different hairstyles.
// Skin Tone: Color picker or predefined options.
// Clothes: Dropdown or icon selection for top and bottom clothes.

// characterSetup in Temp folder (under my-frontend) will be converted to .jsx in this file



// App.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MusicPlayer from './MusicPlayer';
import './app.css';

const clickSound = new Audio('/sounds/click.mp3');
clickSound.volume = 0.5;

const playClickSound = () => {
  clickSound.currentTime = 0;
  clickSound.play();
};

const characters = [
  { id: 1, name: 'Adam', imgSrc: './images/char1.jpg' },
  { id: 2, name: 'Alex', imgSrc: '/images/char2.jpg' },
  { id: 3, name: 'Amelia', imgSrc: '/images/char3.jpg' },
  { id: 4, name: 'Bob', imgSrc: '/images/char4.jpg' },
];

const CharacterSelection = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const navigate = useNavigate();

  const selectCharacter = (character) => {
    setSelectedCharacter(character);
  };

  const completeSelection = () => {
    if (selectedCharacter) {
      // Pass the selected character data to the /gametest page
      navigate('/gametest', { state: { selectedCharacter } });
    } else {
      alert('Please select a character before proceeding!');
    }
  };

  return (
    <div>
       <MusicPlayer audioSrc="/music/Penn.mp3" />
      <h1>Select Your Character</h1>
      <div className="container">
        <div className="character-grid">
          {characters.map((character) => (
            <div
              key={character.id}
              className={`character-card ${selectedCharacter?.id === character.id ? 'selected' : ''}`}
              onClick={() => { playClickSound(); selectCharacter(character); }}
            >
              <img src={character.imgSrc} alt={character.name} />
              <p>{character.name}</p>
            </div>
          ))}
        </div>
        <button className="complete-button" onClick ={() => { playClickSound(); completeSelection(); }}>
          Complete
        </button>
      </div>
    </div>
  );
};

export default CharacterSelection;

