// GameTest.jsx
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useNavigate, useLocation } from 'react-router-dom';
import './GameTest.css';
import MusicPlayer from './MusicPlayer';
import HelpScreen from './HelpScreen';

// Preloading click sound for user interaction feedback
const clickSound = new Audio('/sounds/click.mp3');
clickSound.volume = 0.5;
const playClickSound = () => {
  clickSound.currentTime = 0;
  clickSound.play();
};

const WaterUsageGame = () => {
  const location = useLocation(); // Get the current route's location for data like character or login status
  const navigate = useNavigate(); // Navigate between pages within the app
  const gameContainerRef = useRef(null); // Reference to the game container where the Phaser game will be rendered

  const [dailyLimit, setDailyLimit] = useState(0); // State to store daily water consumption limit
  const [showTrialPopup, setShowTrialPopup] = useState(false); // State for showing trial popup after 1-minute play
  const [loadedGame, setLoadedGame] = useState(null); // State for storing loaded game data (if any)
  const [isPaused, setIsPaused] = useState(false); // State for pausing or unpausing the game
  const [showHelp, setShowHelp] = useState(false); // State for showing help popup

  // Retrieve the character data passed via location state (if any)
  const [character, setCharacter] = useState(
    location.state?.selectedCharacter || { name: 'Default', imgSrc: 'pics/char1.png' }
  );

  // Check if the user is logged in via location state or localStorage
  const isLoggedIn = location.state?.isLoggedIn !== undefined
    ? location.state.isLoggedIn
    : !!localStorage.getItem('token');

  // Fetch the monthly average water consumption from Calgary data API
  useEffect(() => {
    const fetchAndSetMonthlyAverage = async () => {
      try {
        const response = await fetch(
          'https://data.calgary.ca/resource/j7mp-h975.json?$order=date ASC'
        );
        const data = await response.json();
        const todayMonth = new Date().getUTCMonth() + 1;
        const matching = data.filter(item => parseInt(item.monthn) === todayMonth);
        if (matching.length === 0) return;
        const avg = matching.reduce((sum, item) => {
          return sum + parseFloat(item.daily_consumption_per_capita || 0);
        }, 0) / matching.length;
        setDailyLimit(avg); // Set the average daily limit based on historical data
      } catch (err) {
        console.error("Failed to fetch water data:", err); // Log any error that occurs while fetching the data
      }
    };
    fetchAndSetMonthlyAverage();
  }, []); // Only runs once when the component mounts

  // Load saved game data if the user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem('token');
      if (token) {
        fetch('http://localhost:5000/api/game/load', {
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        })
          .then(res => res.json())
          .then(data => {
            if (data?.dailyLimit) {
              setDailyLimit(data.dailyLimit); // Set the daily limit from the loaded game data
              setLoadedGame(data); // Store the loaded game data
              if (data.selectedCharacter && Object.keys(data.selectedCharacter).length > 0) {
                setCharacter(data.selectedCharacter); // Set the selected character from the loaded game data
              }
            }
          })
          .catch(err => console.error('Failed to load saved game:', err)); // Handle error in loading game data
      }
    }
  }, [isLoggedIn]); // Runs whenever the login status changes

  // Initialize the Phaser game instance and game logic
  useEffect(() => {
    if (!dailyLimit || !gameContainerRef.current) return; // Don't initialize the game if there's no daily limit or game container

    let gameInstance;
    let player;
    let cursors, waterUsageText, clickCountText, dailyLimitText, scoreText;
    let trialModeTimeout;
    let waterUsage = loadedGame?.waterUsage || 0;
    let clickCount = loadedGame?.clickCount || 0;
    let lastTriggeredObject = null;

    // Object data for various water-using items
    const waterData = {
      'kitchensink': 12,
      'Toilet': 6,
      'showerHead': 40,
      'TubExterior': 80,
      'Dishwasher': 35,
      'WasherFront': 65,
      // 'Watering lawn': 950, *for later development*
    };

    // Preload function to load all assets (images and sounds)
    function preload() {
      this.load.image('player', character.imgSrc);
      this.load.image('room', 'pics/room.png');
      this.load.image('kitchenSink', 'pics/kitchenSink.png');
      this.load.image('toilet', 'pics/toiletClose.png');
      this.load.image('shower', 'pics/shower.png');

      this.load.image('tubExterior', 'pics/tubExterior.png');
      this.load.image('dishwasher', 'pics/dishwasherClose.png');
      this.load.image('washerFront', 'pics/washerFront.png');
      // this.load.image('washingMachineBack', 'pics/washerBack.png');
      // this.load.image('toiletopen', 'pics/toiletOpen');
      // this.load.image('dishwasherOpen', 'pics/dishwasherOpen.png');
      // this.load.image('dishWasherClose', 'pics/dishwasherClose.png');
      // this.load.image('TubExterior' , 'pics/TubExterior.png');
      // this.load.image('tubEmpty' , 'pics/tubBottomEmpty.png');
      // this.load.image('tubFull' , 'pics/tubBottomFull.png');
      // this.load.image('lawn', 'pics/lawn.png');

      // Wall images
      this.load.image('W1', 'pics/W1.png');
      this.load.image('W2', 'pics/W2.png');
      this.load.image('W3', 'pics/W3.png');
      this.load.image('W4', 'pics/W4.png');
      this.load.image('W5', 'pics/W5.png');
      this.load.image('W6', 'pics/W6.png');

      // Sounds for each item

      this.load.audio('tapSound', 'sounds/tap.mp3');
      this.load.audio('toiletSound', 'sounds/toilet.mp3');
      this.load.audio('showerSound', 'sounds/shower.mp3');
      this.load.audio('bathtubSound', 'sounds/bath.mp3');
      this.load.audio('dishwasherSound', 'sounds/dishwasher.mp3');
      this.load.audio('washing_machineSound', 'sounds/washmachine.mp3');
      this.load.audio('lawnSound', 'sounds/lawn.mp3');
      this.load.audio('footstep', 'sounds/walk.mp3');
    }

    // Create function to set up the game environment (player, objects, collisions, etc.)
    function create() {
      window.phaserScene = this; // Store scene context globally for easy access
      this.add.image(400, 300, 'room'); // Add background room image

      // Create player sprite and set properties
      player = this.physics.add.sprite(400, 300, 'player');
      player.setScale(0.4);
      player.setCollideWorldBounds(true); // Prevent player from moving out of bounds

      if (loadedGame?.characterPosition) {
        player.setPosition(loadedGame.characterPosition.x, loadedGame.characterPosition.y); // Set position from saved game data
      }

      // Initialize sounds and input
      this.footstepSound = this.sound.add('footstep');
      this.input.keyboard.enabled = true;
      cursors = this.input.keyboard.createCursorKeys();

      // Create interactive objects that the player can click on
      const items = [
        { key: 'kitchenSink', x: 112, y: 50, type: 'kitchensink' },
        { key: 'toilet', x: 646, y: 326, type: 'Toilet' },
        { key: 'shower', x: 753, y: 318, type: 'showerHead' },
        { key: 'tubExterior', x: 670, y: 560, type: 'TubExterior' },
        { key: 'dishwasher', x: 41, y: 72, type: 'Dishwasher' },
        { key: 'washerFront', x: 675, y: 263, type: 'WasherFront' },
        // { key: 'lawn', x: 410, y: 550, type: 'Watering lawn' }, *for later development*
      ];

      const objects = items.map(item => {
        const obj = this.physics.add.staticSprite(item.x, item.y, item.key); // Add static objects to the scene
        obj.type = item.type; // Attach the type of object to the sprite for easy reference
        return obj;
      });

      // Create walls to prevent the player from going out of the designated area
      const walls = [
        { key: 'W1', x: 288, y: 222 }, //topLeft
        { key: 'W2', x: 609, y: 222 }, //topRight
        { key: 'W3', x: 610, y: 346 }, //middleRight
        { key: 'W4', x: 287, y: 348 }, //middleLeft
        { key: 'W5', x: 608, y: 590 }, //bottomRight
        { key: 'W6', x: 288, y: 590 }, //bottomLeft

      ];
      walls.forEach(wall => {
        const wallSprite = this.physics.add.staticImage(wall.x, wall.y, wall.key);
        this.physics.add.collider(player, wallSprite); // Set up collision with walls
      });

      // Set up collision and interaction logic for objects
      objects.forEach(object => {
        this.physics.add.overlap(player, object, () => {
          if (lastTriggeredObject !== object) { // Ensure object is triggered only once
            lastTriggeredObject = object;
            clickCount++; // Increment click count
            waterUsage += waterData[object.type] || 0; // Update water usage based on the object type
            updateUI.call(this); // Update the UI with the new values

            // Play sound based on the object interacted with
            const soundKey = {
              'kitchensink': 'tapSound',
              'toilet': 'toiletSound',
              'showerhead': 'showerSound',
              'TubExterior': 'bathtubSound',
              'Dishwasher': 'dishwasherSound',
              'WasherFront': 'washing_machineSound',
              // 'Watering lawn': 'lawnSound', *for later development*
              
            }[object.type];
            if (soundKey) this.sound.play(soundKey);

            // End the game if water usage exceeds the daily limit or after 10 clicks
            if (waterUsage > dailyLimit) endGame.call(this, 'fail');
            else if (clickCount === 10 && waterUsage <= dailyLimit) endGame.call(this, 'success');
          }
        });
      });

      // Display UI text (water usage, score, etc.)
      waterUsageText = this.add.text(10, 10, `Water Usage: ${waterUsage}L`, { fontSize: '16px', fill: '#000' });
      dailyLimitText = this.add.text(10, 30, `Daily Limit: ${dailyLimit}L`, { fontSize: '16px', fill: '#000' });
      scoreText = this.add.text(10, 50, `Score: ${dailyLimit - waterUsage}L`, { fontSize: '16px', fill: '#000' });
      clickCountText = this.add.text(10, 70, `Clicks Left: ${10 - clickCount}`, { fontSize: '16px', fill: '#000' });

      // If not logged in, show trial mode timeout
      if (!isLoggedIn) {
        trialModeTimeout = setTimeout(() => {
          this.scene.pause();
          setShowTrialPopup(true);
        }, 60000); // Trigger after 60 seconds
      }
    }

    // Update function to move the player based on keyboard input
    function update() {
      if (!player) return;
      player.setVelocity(0); // Reset player velocity each frame
      let moving = false;

      if (cursors.left.isDown) {
        player.setVelocityX(-200); // Move left
        moving = true;
      } else if (cursors.right.isDown) {
        player.setVelocityX(200); // Move right
        moving = true;
      }

      if (cursors.up.isDown) {
        player.setVelocityY(-200); // Move up
        moving = true;
      } else if (cursors.down.isDown) {
        player.setVelocityY(200); // Move down
        moving = true;
      }

      // Play footstep sound when the player is moving
      if (moving && !this.footstepSound.isPlaying) {
        this.footstepSound.play({ loop: true });
      } else if (!moving && this.footstepSound.isPlaying) {
        this.footstepSound.stop(); // Stop footstep sound when not moving
      }
    }

    // Function to update UI elements with the current game stats
    function updateUI() {
      waterUsageText.setText(`Water Usage: ${waterUsage}L`);
      clickCountText.setText(`Clicks Left: ${10 - clickCount}`);
      scoreText.setText(`Score: ${dailyLimit - waterUsage}L`);
    }

    // Function to handle game over and display end message
    function endGame(result) {
      const message = result === 'fail' ? 'Game Over! You used too much!' : 'Congratulations! You passed!';
      this.add.text(200, 300, message, { fontSize: '32px', fill: '#000' });
      this.scene.pause(); // Pause the game when it's over
    }

    // Create Phaser game instance
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 640,
      parent: gameContainerRef.current,
      physics: { default: 'arcade', arcade: { debug: true } },
      scene: { preload, create, update },
    };

    gameInstance = new Phaser.Game(config);

    return () => {
      // Save the game data when the component unmounts
      const token = localStorage.getItem('token');
      if (token) {
        const gameData = {
          dailyLimit,
          waterUsage,
          clickCount,
          score: dailyLimit - waterUsage,
          characterPosition: player ? { x: player.x, y: player.y } : { x: 0, y: 0 },
          dropdownData: dailyLimit,
          selectedCharacter: character,
        };
        fetch('http://localhost:5000/api/game/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify(gameData),
        });
      }
      if (trialModeTimeout) clearTimeout(trialModeTimeout);
      if (gameInstance) gameInstance.destroy(true); // Clean up Phaser game instance
    };
  }, [dailyLimit, character, isLoggedIn, loadedGame]);

  // Handle saving the game and quitting
  const handleSaveAndQuit = async () => {
    playClickSound();
    const token = localStorage.getItem('token');
    if (token && window.phaserScene) {
      const player = window.phaserScene.children.list.find(obj => obj.texture?.key === 'player');
      const gameData = {
        dailyLimit,
        waterUsage: loadedGame?.waterUsage || 0,
        clickCount: loadedGame?.clickCount || 0,
        score: dailyLimit - (loadedGame?.waterUsage || 0),
        characterPosition: player ? { x: player.x, y: player.y } : { x: 0, y: 0 },
        dropdownData: dailyLimit,
        selectedCharacter: character,
      };
      await fetch('http://localhost:5000/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(gameData),
      });
      localStorage.removeItem('token');
      navigate('/login'); // Redirect to login page
    }
  };

  return (
    <div className="water-game-container">
      <MusicPlayer audioSrc="/music/California.mp3" /> {/* Music player for background music */}

      {/* Logout button */}
      <div className="logout-button-container">
        <button className="logout-button" onClick={() => navigate('/login')}>Log Out</button>
      </div>

      {/* Display daily challenge information */}
      <div className="selection-box">
        <h3>Your water challenge today is based on the average daily consumption for this day in history.</h3>
        <p><strong>{Math.round(dailyLimit)}L</strong> is your target for today.</p>
      </div>

      {/* Game container for Phaser */}
      <div className="game-area" id="game-container" ref={gameContainerRef}></div>

      {/* Pause and main menu buttons */}
      {!isPaused && (
        <div
          className="button-overlay"
          style={{
            position: 'absolute',
            top: '780px',
            left: '55%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <button className="submit-btn" onClick={() => { playClickSound(); setIsPaused(true); if (window.phaserScene) window.phaserScene.scene.pause(); }}>
            ⏸ Pause
          </button>
          <button className="submit-btn" onClick={() => { playClickSound(); navigate('/menu'); }}>
            Main Menu
          </button>
        </div>
      )}

      {/* Paused game overlay */}
      {isPaused && (
        <div className="trial-popup-overlay">
          <div className="trial-popup" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <h2>Game Paused</h2>
            <p>The game is currently paused. Choose an option below:</p>
            <button className="submit-btn" onClick={() => { playClickSound(); setIsPaused(false); if (window.phaserScene) window.phaserScene.scene.resume(); }}>▶ Resume</button>
            <button className="submit-btn" onClick={() => { playClickSound(); setShowHelp(true); }}>❓ Help</button>
            <button className="submit-btn" onClick={handleSaveAndQuit}>💾 Save & Quit</button>
          </div>
        </div>
      )}

      {/* Help screen popup */}
      {showHelp && <HelpScreen onClose={() => setShowHelp(false)} />}

      {/* Trial mode popup */}
      {showTrialPopup && (
        <div className="trial-popup-overlay">
          <div className="trial-popup">
            <h2>Thank you for playing, signup to play more!</h2>
            <button onClick={() => navigate('/login')}>Go to Login</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterUsageGame;
