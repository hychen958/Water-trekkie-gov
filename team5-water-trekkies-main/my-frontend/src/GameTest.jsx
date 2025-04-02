// GameTest.jsx
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useNavigate, useLocation } from 'react-router-dom';
import './GameTest.css';
import MusicPlayer from './MusicPlayer';

// Initialize click sound for buttons
const clickSound = new Audio('/sounds/click.mp3');
clickSound.volume = 0.5;

const playClickSound = () => {
  clickSound.currentTime = 0;
  clickSound.play();
};

const WaterUsageGame = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const gameContainerRef = useRef(null);

  // State for water usage goal and trial popup visibility
  const [dailyLimit, setDailyLimit] = useState(0);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [loadedGame, setLoadedGame] = useState(null);

  // Set selected character (either from navigation state or default)
  const [character, setCharacter] = useState(
    location.state?.selectedCharacter || { name: 'Default', imgSrc: 'pics/char1.png' }
  );

  // Check if user is logged in (based on navigation state or token)
  const isLoggedIn = location.state?.isLoggedIn !== undefined
    ? location.state.isLoggedIn
    : !!localStorage.getItem('token');

  // Fetch daily water usage limit (Calgary historical data)
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
        setDailyLimit(avg);
      } catch (err) {
        console.error("Failed to fetch water data:", err);
      }
    };
    fetchAndSetMonthlyAverage();
  }, []);

  // Load previous game if user is logged in
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
              setDailyLimit(data.dailyLimit);
              setLoadedGame(data);
              if (data.selectedCharacter && Object.keys(data.selectedCharacter).length > 0) {
                setCharacter(data.selectedCharacter);
              }
            }
          })
          .catch(err => console.error('Failed to load saved game:', err));
      }
    }
  }, [isLoggedIn]);

  // Phaser game logic
  useEffect(() => {
    if (!dailyLimit || !gameContainerRef.current) return;

    let gameInstance;
    let player;
    let cursors, waterUsageText, clickCountText, dailyLimitText, scoreText;
    let trialModeTimeout;
    let waterUsage = loadedGame?.waterUsage || 0;
    let clickCount = loadedGame?.clickCount || 0;
    let lastTriggeredObject = null;

    // Water usage values for different appliances/actions
    const waterData = {
      'kitchensink': 12,
      'Toilet': 6,
      'showerHead': 40,
      'TubExterior': 80,
      'Dishwasher': 35,
      'WasherFront': 65,
      // 'Watering lawn': 950, *for later development*
    };

    // Load assets
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

    // Setup game scene
    function create() {
      this.add.image(400, 300, 'room');

      // Create player
      player = this.physics.add.sprite(400, 300, 'player');
      player.setScale(0.4);
      player.setCollideWorldBounds(true);

      if (loadedGame?.characterPosition) {
        player.setPosition(loadedGame.characterPosition.x, loadedGame.characterPosition.y);
      }

      this.footstepSound = this.sound.add('footstep');
      this.input.keyboard.enabled = true;
      cursors = this.input.keyboard.createCursorKeys();

      // Setup interactive objects
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
        const obj = this.physics.add.staticSprite(item.x, item.y, item.key);
        obj.type = item.type;
        return obj;
      });

      // Create collision walls
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
        this.physics.add.collider(player, wallSprite);
      });

      // Handle interaction with objects
      objects.forEach(object => {
        this.physics.add.overlap(player, object, () => {
          if (lastTriggeredObject !== object) {
            lastTriggeredObject = object;
            clickCount++;
            waterUsage += waterData[object.type] || 0;
            updateUI.call(this);

            // Play item sound
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

            // Check game end conditions
            if (waterUsage > dailyLimit) endGame.call(this, 'fail');
            else if (clickCount === 10 && waterUsage <= dailyLimit) endGame.call(this, 'success');
          }
        });
      });

      // Display UI stats
      waterUsageText = this.add.text(10, 10, `Water Usage: ${waterUsage}L`, { fontSize: '16px', fill: '#000' });
      dailyLimitText = this.add.text(10, 30, `Daily Limit: ${dailyLimit}L`, { fontSize: '16px', fill: '#000' });
      scoreText = this.add.text(10, 50, `Score: ${dailyLimit - waterUsage}L`, { fontSize: '16px', fill: '#000' });
      clickCountText = this.add.text(10, 70, `Clicks Left: ${10 - clickCount}`, { fontSize: '16px', fill: '#000' });

      // Trial mode restriction (pause after 60 seconds)
      if (!isLoggedIn) {
        trialModeTimeout = setTimeout(() => {
          this.scene.pause();
          setShowTrialPopup(true);
        }, 60000);
      }
    }

    // Handle player movement
    function update() {
      if (!player) return;
      player.setVelocity(0);
      let moving = false;

      if (cursors.left.isDown) {
        player.setVelocityX(-200);
        moving = true;
      } else if (cursors.right.isDown) {
        player.setVelocityX(200);
        moving = true;
      }

      if (cursors.up.isDown) {
        player.setVelocityY(-200);
        moving = true;
      } else if (cursors.down.isDown) {
        player.setVelocityY(200);
        moving = true;
      }

      if (moving && !this.footstepSound.isPlaying) {
        this.footstepSound.play({ loop: true });
      } else if (!moving && this.footstepSound.isPlaying) {
        this.footstepSound.stop();
      }
    }

    // Update UI text
    function updateUI() {
      waterUsageText.setText(`Water Usage: ${waterUsage}L`);
      clickCountText.setText(`Clicks Left: ${10 - clickCount}`);
      scoreText.setText(`Score: ${dailyLimit - waterUsage}L`);
    }

    // Display game result
    function endGame(result) {
      const message = result === 'fail' ? 'Game Over! You used too much!' : 'Congratulations! You passed!';
      this.add.text(200, 300, message, { fontSize: '32px', fill: '#000' });
      this.scene.pause();
    }

    // Phaser game config
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 640,
      parent: gameContainerRef.current,
      physics: { default: 'arcade', arcade: { debug: true } },
      scene: { preload, create, update },
    };

    gameInstance = new Phaser.Game(config);

    // Cleanup and save game state if logged in
    return () => {
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
      if (gameInstance) gameInstance.destroy(true);
    };
  }, [dailyLimit, character, isLoggedIn, loadedGame]);

  return (
    <div className="water-game-container">
      <MusicPlayer audioSrc="/music/California.mp3" />

      {/* Logout Button */}
      <div className="logout-button-container">
        <button className="logout-button" onClick={() => navigate('/login')}>Log Out</button>
      </div>

      {/* Display water goal for the day */}
      <div className="selection-box">
        <h3>Your water challenge today is based on the average daily consumption for this day in history.</h3>
        <p><strong>{Math.round(dailyLimit)}L</strong> is your target for today.</p>
      </div>

      {/* Phaser Game Container */}
      <div className="game-area" id="game-container" ref={gameContainerRef}></div>

      {/* Main Menu Button */}
      <div className="main-menu-button-container">
        <button className="main-menu-button" onClick={() => { playClickSound(); navigate('/menu'); }}>
          Main Menu
        </button>
      </div>

      {/* Trial popup shown for guest users */}
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

