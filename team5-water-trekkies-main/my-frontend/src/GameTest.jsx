import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useNavigate, useLocation } from 'react-router-dom';
import './GameTest.css';
import MusicPlayer from './MusicPlayer';

const clickSound = new Audio('/sounds/click.mp3');
clickSound.volume = 0.5;

const playClickSound = () => {
  clickSound.currentTime = 0;
  clickSound.play();
};

const WaterUsageGame = () => {
  const gameContainerRef = useRef(null);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [options, setOptions] = useState([]);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [loadedGame, setLoadedGame] = useState(null);
  const [character, setCharacter] = useState(
    useLocation().state?.selectedCharacter || { name: 'Default', imgSrc: 'pics/char1.png' }
  );
  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn =
    location.state?.isLoggedIn !== undefined
      ? location.state.isLoggedIn
      : localStorage.getItem('token') ? true : false;

  // Retrieve dropdown menu data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'https://data.calgary.ca/resource/j7mp-h975.json?$select=date,daily_consumption_per_capita&$order=date ASC'
        );
        const data = await response.json();
        const formattedOptions = data.map(item => ({
          label: item.date,
          value: parseFloat(item.daily_consumption_per_capita),
        }));
        setOptions(formattedOptions);
      } catch (error) {
        console.error('Failed to fetch data from the API:', error);
      }
    };
    fetchData();
  }, []);

  // Load game state and update character data (if the user is logged in)
  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem('token');
      if (token) {
        fetch('http://localhost:5000/api/game/load', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
        })
          .then(response => response.json())
          .then(data => {
            if (data && data.dailyLimit) {
              setDailyLimit(data.dailyLimit);
              setLoadedGame(data);
              if (data.selectedCharacter && Object.keys(data.selectedCharacter).length > 0) {
                setCharacter(data.selectedCharacter);
              }
            }
          })
          .catch(err => console.error('Failed to load game state:', err));
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // Only create a game instance when dailyLimit is not 0 (e.g., when the daily limit has been selected)
    if (!dailyLimit) return;

    let gameInstance = null;
    let player;
    let cursors, waterUsageText, clickCountText, dailyLimitText, scoreText;
    let trialModeTimeout;
    let waterUsage = loadedGame ? loadedGame.waterUsage : 0;
    let clickCount = loadedGame ? loadedGame.clickCount : 0;
    
    // Save an array of all objects
    let objects = [];
    //Used to record the object that last triggered a collision
    let lastTriggeredObject = null;
    
    const waterData = {
      'Tap': 12,
      'Low-flow toilet': 6,
      'Low-flow showerhead': 40,
      'Bathtub': 80,
      'Dishwasher': 35,
      'Front-load washing machine': 65,
      'Watering lawn': 950,
    };

    function preload() {
      // Load image assets
      this.load.image('player', character.imgSrc);
      this.load.image('room', 'pics/room.jpg');
      this.load.image('tap', 'pics/tap.png');
      this.load.image('toilet', 'pics/toilet.png');
      this.load.image('shower', 'pics/shower.png');
      this.load.image('bathtub', 'pics/bathtub.png');
      this.load.image('dishwasher', 'pics/dishwasher.png');
      this.load.image('washing_machine', 'pics/washmachine.png');
      this.load.image('lawn', 'pics/lawn.png');
      this.load.image('1', 'pics/1.png');
      this.load.image('2', 'pics/2.png');
      this.load.image('3', 'pics/3.png');
      this.load.image('4', 'pics/4.png');
      this.load.image('5', 'pics/5.png');
      this.load.image('6', 'pics/6.png');


      // Load sound assets
      this.load.audio('tapSound', 'sounds/tap.mp3');
      this.load.audio('toiletSound', 'sounds/toilet.mp3');
      this.load.audio('showerSound', 'sounds/shower.mp3');
      this.load.audio('bathtubSound', 'sounds/bath.mp3');
      this.load.audio('dishwasherSound', 'sounds/dishwasher.mp3');
      this.load.audio('washing_machineSound', 'sounds/washmachine.mp3');
      this.load.audio('lawnSound', 'sounds/lawn.mp3');
      // Load footstep sound effect
      this.load.audio('footstep', 'sounds/walk.mp3');
    }

    function create() {
      this.add.image(400, 300, 'room');
      player = this.physics.add.sprite(400, 300, 'player');
      if (loadedGame && loadedGame.characterPosition) {
        player.x = loadedGame.characterPosition.x;
        player.y = loadedGame.characterPosition.y;
      }
      player.setScale(0.4);
      player.setCollideWorldBounds(true);

      // Create footstep sound object
      this.footstepSound = this.sound.add('footstep');

      // Click the canvas to ensure the keyboard can receive events
      this.input.on('pointerdown', () => {
        this.input.keyboard.enabled = true;
      });

      cursors = this.input.keyboard.createCursorKeys();

      const items = [
        { key: 'tap', x: 100, y: 180, type: 'Tap' },
        { key: 'toilet', x: 700, y: 180, type: 'Low-flow toilet' },
        { key: 'shower', x: 100, y: 500, type: 'Low-flow showerhead' },
        { key: 'bathtub', x: 700, y: 500, type: 'Bathtub' },
        { key: 'dishwasher', x: 500, y: 100, type: 'Dishwasher' },
        { key: 'washing_machine', x: 300, y: 100, type: 'Front-load washing machine' },
        { key: 'lawn', x: 400, y: 500, type: 'Watering lawn' },
        { key: '1', x: 232, y: 47, type: '1' },
        { key: '2', x: 592, y: 47, type: '2' },
        { key: '3', x: 232, y: 360, type: '3' },
        { key: '4', x: 592, y: 359, type: '4' },
        { key: '5', x: 105, y: 351, type: '5' },
        { key: '6', x: 720, y: 330, type: '6' },
      ];

      // Create all objects
      objects = items.map(item => {
        const obj = this.physics.add.staticSprite(item.x, item.y, item.key);
        obj.type = item.type;
        return obj;
      });

      // Add overlap event for each object: only execute when the triggered object is different from the last one
      objects.forEach(object => {
        this.physics.add.overlap(player, object, () => {
          if (lastTriggeredObject !== object) {
            lastTriggeredObject = object;
            clickCount++;
            waterUsage += waterData[object.type];
            updateUI.call(this);

            let soundKey;
            switch (object.type) {
              case 'Tap':
                soundKey = 'tapSound';
                break;
              case 'Low-flow toilet':
                soundKey = 'toiletSound';
                break;
              case 'Low-flow showerhead':
                soundKey = 'showerSound';
                break;
              case 'Bathtub':
                soundKey = 'bathtubSound';
                break;
              case 'Dishwasher':
                soundKey = 'dishwasherSound';
                break;
              case 'Front-load washing machine':
                soundKey = 'washing_machineSound';
                break;
              case 'Watering lawn':
                soundKey = 'lawnSound';
                break;
              default:
                soundKey = null;
            }
            if (soundKey) {
              this.sound.play(soundKey);
            }

            if (waterUsage > dailyLimit) {
              endGame.call(this, 'fail');
            } else if (clickCount === 10 && waterUsage <= dailyLimit) {
              endGame.call(this, 'success');
            }
          }
        });
      });

      waterUsageText = this.add.text(10, 10, `Water Usage: ${waterUsage}L`, { fontSize: '16px', fill: '#000' });
      dailyLimitText = this.add.text(10, 30, `Daily Limit: ${dailyLimit}L`, { fontSize: '16px', fill: '#000' });
      scoreText = this.add.text(10, 50, `Score: ${waterUsage}L`, { fontSize: '16px', fill: '#000' });
      clickCountText = this.add.text(10, 70, `Clicks Left: ${10 - clickCount}`, { fontSize: '16px', fill: '#000' });

      if (!isLoggedIn) {
        trialModeTimeout = setTimeout(() => {
          this.scene.pause();
          setShowTrialPopup(true);
        }, 60000);
      }
    }

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
      // Manage footstep sound: if the player is moving and the footstep sound is not playing, play the looping footstep sound; otherwise, stop it
      if (moving) {
        if (!this.footstepSound.isPlaying) {
          this.footstepSound.play({ loop: true });
        }
      } else {
        if (this.footstepSound.isPlaying) {
          this.footstepSound.stop();
        }
      }
// Only update lastTriggeredObject when the player collides with another object 
// No other reset actions are performed here
    }

    function updateUI() {
      waterUsageText.setText(`Water Usage: ${waterUsage}L`);
      clickCountText.setText(`Clicks Left: ${10 - clickCount}`);
      scoreText.setText(`Score: ${waterUsage}L`);
    }

    function endGame(result) {
      const message =
        result === 'fail'
          ? 'Game Over! You used too much!'
          : 'Congratulations! You passed!';
      this.add.text(200, 300, message, { fontSize: '32px', fill: '#000' });
      this.scene.pause();
    }

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameContainerRef.current,
      physics: { default: 'arcade', arcade: { debug: false } },
      scene: { preload, create, update },
    };

    gameInstance = new Phaser.Game(config);

    return () => {
      const token = localStorage.getItem('token');
      if (token) {
        const gameData = {
          dailyLimit: dailyLimit,
          waterUsage: waterUsage,
          clickCount: clickCount,
          score: waterUsage,
          characterPosition: player ? { x: player.x, y: player.y } : { x: 0, y: 0 },
          dropdownData: dailyLimit,
          selectedCharacter: character,
        };
        fetch('http://localhost:5000/api/game/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
          },
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
      <div className="logout-button-container">
        <button className="logout-button" onClick={() => navigate('/login')}>
          Log Out
        </button>
      </div>

      <div className="selection-box">
        <label className="title">Select Daily Consumption Limit:</label>
        <h3>
          Water consumption was bad in the old days - easy game level. For challenge, choose the most current dates to see how you compare with your neighbors!
        </h3>
        <select className="dropdown" value={dailyLimit} onChange={e => setDailyLimit(Number(e.target.value))}>
          <option value="">-- Select --</option>
          {options.map(option => (
            <option key={option.label} value={option.value}>
              {option.label}: {option.value}L
            </option>
          ))}
        </select>
      </div>

      <div className="game-area" ref={gameContainerRef}></div>

      <div className="main-menu-button-container">
        <button className="main-menu-button" onClick={() => { playClickSound(); navigate('/menu'); }}>
          Main Menu
        </button>
      </div>

      {showTrialPopup && (
        <div className="trial-popup-overlay">
          <div className="trial-popup">
            <h2>Thank you for playing, signup to play more!</h2>
            <button onClick={() => { playClickSound(); navigate('/login'); }}>Go to Login</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterUsageGame;
