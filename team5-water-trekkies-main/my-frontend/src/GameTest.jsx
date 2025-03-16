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
  const navigate = useNavigate();
  const location = useLocation();
  
  // 取得角色資料，若無則使用預設值
  const selectedCharacter = location.state?.selectedCharacter || { name: 'Default', imgSrc: 'pics/char1.png' };
  // 判斷是否登入：優先檢查 location.state 傳遞的 isLoggedIn，否則以 localStorage 判斷
  const isLoggedIn = (location.state?.isLoggedIn !== undefined) 
    ? location.state.isLoggedIn 
    : (localStorage.getItem('token') ? true : false);

  // 取得下拉選單資料
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

  // 若已登入，嘗試載入之前儲存的遊戲狀態
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
            }
          })
          .catch(err => console.error('Failed to load game state:', err));
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!dailyLimit) return;
    
    let gameInstance = null;
    let gameScene = null;
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
      this.load.image('player', selectedCharacter.imgSrc);
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
      gameScene = this;
      this.add.image(400, 300, 'room');
      player = this.physics.add.sprite(400, 300, 'player');
      // 若有儲存過的角色位置，則從記錄中載入
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
      
      // 若非登入狀態，啟動試玩模式：1分鐘後暫停並顯示試玩提示
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
  }, [dailyLimit, selectedCharacter, isLoggedIn, loadedGame]);

  return (
    <div className="water-game-container">
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
        <button className="main-menu-button" onClick={() => navigate('/menu')}>
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

