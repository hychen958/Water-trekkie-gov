// GameTest.jsx
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useNavigate, useLocation } from 'react-router-dom';
import './GameTest.css';

const WaterUsageGame = () => {
  const gameContainerRef = useRef(null);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [options, setOptions] = useState([]);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [loadedGame, setLoadedGame] = useState(null);
  // Separate the character state, with the initial value coming from location.state or a default value
  const [character, setCharacter] = useState(
    useLocation().state?.selectedCharacter || { name: 'Default', imgSrc: 'pics/char1.png' }
  );
  const navigate = useNavigate();
  const location = useLocation();
  
  const isLoggedIn = (location.state?.isLoggedIn !== undefined)
    ? location.state.isLoggedIn 
    : (localStorage.getItem('token') ? true : false);


// Automatically set daily limit based on today's date
useEffect(() => {
  const fetchAndSetMonthlyAverage = async () => {
    try {
      const response = await fetch(
        'https://data.calgary.ca/resource/j7mp-h975.json?$order=date ASC'
      );
      const data = await response.json();

      console.log('Sample API entries:', data.slice(0, 5));

      const today = new Date();
      const todayMonth = today.getUTCMonth() + 1; // e.g. 3 for March

      const matching = data.filter(item => parseInt(item.monthn) === todayMonth);

      console.log(`Matching entries for month ${todayMonth}:`, matching);

      if (matching.length === 0) {
        console.warn("No matching data found for this month.");
        return;
      }

      const avg = matching.reduce((sum, item) => {
        return sum + parseFloat(item.daily_consumption_per_capita || 0);
      }, 0) / matching.length;

      setDailyLimit(avg);
    } catch (err) {
      console.error("Failed to fetch and calculate monthly average limit:", err);
    }
  };

  fetchAndSetMonthlyAverage();
}, []);



  // If already logged in, try to load the previously saved game state and update the character information
  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem('token');
      if (token) {
        fetch('http://localhost:5000/api/game/load', {
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        })
          .then(response => response.json())
          .then(data => {
            if (data && data.dailyLimit) {
              setDailyLimit(data.dailyLimit);
              setLoadedGame(data);
              // If a character is saved in the database, update the character
              if(data.selectedCharacter && Object.keys(data.selectedCharacter).length > 0) {
                setCharacter(data.selectedCharacter);
              }
            }
          })
          .catch(err => console.error('Failed to load game state:', err));
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!dailyLimit) return;
    
    let gameInstance = null;
    let player;
    let cursors, waterUsageText, clickCountText, dailyLimitText, scoreText;
    let trialModeTimeout;
    let waterUsage = loadedGame ? loadedGame.waterUsage : 0;
    let clickCount = loadedGame ? loadedGame.clickCount : 0;
    
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
      // Use the updated character information
      this.load.image('player', character.imgSrc);
      this.load.image('room', 'pics/room.jpg');
      this.load.image('tap', 'pics/tap.png');
      this.load.image('toilet', 'pics/toilet.png');
      this.load.image('shower', 'pics/shower.png');
      this.load.image('bathtub', 'pics/bathtub.png');
      this.load.image('dishwasher', 'pics/dishwasher.png');
      this.load.image('washing_machine', 'pics/washmachine.png');
      this.load.image('lawn', 'pics/lawn.png');
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
      cursors = this.input.keyboard.createCursorKeys();

      const items = [
        { key: 'tap', x: 100, y: 180, type: 'Tap' },
        { key: 'toilet', x: 700, y: 180, type: 'Low-flow toilet' },
        { key: 'shower', x: 100, y: 500, type: 'Low-flow showerhead' },
        { key: 'bathtub', x: 700, y: 500, type: 'Bathtub' },
        { key: 'dishwasher', x: 500, y: 100, type: 'Dishwasher' },
        { key: 'washing_machine', x: 300, y: 100, type: 'Front-load washing machine' },
        { key: 'lawn', x: 400, y: 500, type: 'Watering lawn' },
      ];

      const objects = items.map(item => {
        const object = this.physics.add.staticSprite(item.x, item.y, item.key);
        object.type = item.type;
        return object;
      });

      let lastActivatedObject = null;
      objects.forEach(object => {
        this.physics.add.overlap(player, object, () => {
          if (clickCount < 10 && (!object.clicked || lastActivatedObject !== object)) {
            if (lastActivatedObject) {
              lastActivatedObject.clicked = false;
            }
            object.clicked = true;
            lastActivatedObject = object;
            clickCount++;
            waterUsage += waterData[object.type];
            updateUI.call(this);
            
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
      scoreText = this.add.text(10, 50, `Score: ${dailyLimit - waterUsage}L`, { fontSize: '16px', fill: '#000' });
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
      if (cursors.left.isDown) {
        player.setVelocityX(-200);
      } else if (cursors.right.isDown) {
        player.setVelocityX(200);
      }
      if (cursors.up.isDown) {
        player.setVelocityY(-200);
      } else if (cursors.down.isDown) {
        player.setVelocityY(200);
      }
    }

    function updateUI() {
      waterUsageText.setText(`Water Usage: ${waterUsage}L`);
      clickCountText.setText(`Clicks Left: ${10 - clickCount}`);
      scoreText.setText(`Score: ${dailyLimit - waterUsage}L`);
    }

    function endGame(result) {
      const message = result === 'fail' ? 'Game Over! You used too much!' : 'Congratulations! You passed!';
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
      <div className="logout-button-container">
        <button className="logout-button" onClick={() => navigate('/login')}>
          Log Out
        </button>
      </div>
  
      <div className="selection-box">
        <h3>
          Your water challenge today is based on the average daily consumption for this day in history.
        </h3>
        <p>
          <strong>{Math.round(dailyLimit)}L</strong> is your target for today.
        </p>
      </div>
  

      <div className="game-area" id="game-container" ref={gameContainerRef}></div>
        <div className="main-menu-button-container">
        <button className="main-menu-button" onClick={() => { playClickSound(); navigate('/menu'); }}>
          Main Menu
        </button>
      </div>

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
