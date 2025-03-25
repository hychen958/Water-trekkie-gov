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
      'Tap': 12,
      'Low-flow toilet': 6,
      'Low-flow showerhead': 40,
      'Bathtub': 80,
      'Dishwasher': 35,
      'Front-load washing machine': 65,
      'Watering lawn': 950,
    };

    // Load assets
    function preload() {
      this.load.image('player', character.imgSrc);
      this.load.image('room', 'pics/room.jpg');
      this.load.image('tap', 'pics/tap.png');
      this.load.image('toilet', 'pics/toilet.png');
      this.load.image('shower', 'pics/shower.png');
      this.load.image('bathtub', 'pics/bathtub.png');
      this.load.image('dishwasher', 'pics/dishwasher.png');
      this.load.image('washing_machine', 'pics/washmachine.png');
      this.load.image('lawn', 'pics/lawn.png');

      // Wall images
      this.load.image('1', 'pics/1.png');
      this.load.image('2', 'pics/2.png');
      this.load.image('3', 'pics/3.png');
      this.load.image('4', 'pics/4.png');
      this.load.image('5', 'pics/5.png');
      this.load.image('6', 'pics/6.png');

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
        { key: 'tap', x: 100, y: 180, type: 'Tap' },
        { key: 'toilet', x: 700, y: 180, type: 'Low-flow toilet' },
        { key: 'shower', x: 100, y: 500, type: 'Low-flow showerhead' },
        { key: 'bathtub', x: 700, y: 500, type: 'Bathtub' },
        { key: 'dishwasher', x: 500, y: 100, type: 'Dishwasher' },
        { key: 'washing_machine', x: 300, y: 100, type: 'Front-load washing machine' },
        { key: 'lawn', x: 410, y: 550, type: 'Watering lawn' },
      ];

      const objects = items.map(item => {
        const obj = this.physics.add.staticSprite(item.x, item.y, item.key);
        obj.type = item.type;
        return obj;
      });

      // Create collision walls
      const walls = [
        { key: '1', x: 232, y: 47 },
        { key: '2', x: 592, y: 47 },
        { key: '3', x: 232, y: 360 },
        { key: '4', x: 592, y: 359 },
        { key: '5', x: 105, y: 351 },
        { key: '6', x: 720, y: 330 },
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
              'Tap': 'tapSound',
              'Low-flow toilet': 'toiletSound',
              'Low-flow showerhead': 'showerSound',
              'Bathtub': 'bathtubSound',
              'Dishwasher': 'dishwasherSound',
              'Front-load washing machine': 'washing_machineSound',
              'Watering lawn': 'lawnSound',
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
      height: 600,
      parent: gameContainerRef.current,
      physics: { default: 'arcade', arcade: { debug: false } },
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

