// GameTest.jsx
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { useNavigate, useLocation } from 'react-router-dom';
import './GameTest.css';
import MusicPlayer from './MusicPlayer';
import HelpScreen from './HelpScreen';

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

  const [dailyLimit, setDailyLimit] = useState(0);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [loadedGame, setLoadedGame] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [waterUsage, setWaterUsage] = useState(0);
  const [clickCount, setClickCount] = useState(0);

  const [character, setCharacter] = useState(
    location.state?.selectedCharacter || { name: 'Default', imgSrc: 'pics/char1.png' }
  );

  const isLoggedIn = location.state?.isLoggedIn !== undefined
    ? location.state.isLoggedIn
    : !!localStorage.getItem('token');

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
        const avg = matching.reduce((sum, item) => sum + parseFloat(item.daily_consumption_per_capita || 0), 0) / matching.length;
        setDailyLimit(avg);
      } catch (err) {
        console.error("Failed to fetch water data:", err);
      }
    };
    fetchAndSetMonthlyAverage();
  }, []);

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
              setWaterUsage(data.waterUsage || 0);
              setClickCount(data.clickCount || 0);
              if (data.selectedCharacter && Object.keys(data.selectedCharacter).length > 0) {
                setCharacter(data.selectedCharacter);
              }
            }
          })
          .catch(err => console.error('Failed to load saved game:', err));
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!dailyLimit || !gameContainerRef.current) return;

    let gameInstance;
    let player;
    let cursors;
    let trialModeTimeout;
    let lastTriggeredObject = null;

    const waterData = {
      'kitchensink': 12,
      'Toilet': 6,
      'showerHead': 40,
      'TubExterior': 80,
      'Dishwasher': 35,
      'WasherFront': 65,
    };

    function preload() {
      this.load.image('player', character.imgSrc);
      this.load.image('room', 'pics/room.png');
      this.load.image('kitchenSink', 'pics/kitchenSink.png');
      this.load.image('toilet', 'pics/toiletClose.png');
      this.load.image('shower', 'pics/shower.png');
      this.load.image('tubExterior', 'pics/tubExterior.png');
      this.load.image('dishwasher', 'pics/dishwasherClose.png');
      this.load.image('washerFront', 'pics/washerFront.png');
      this.load.image('W1', 'pics/W1.png');
      this.load.image('W2', 'pics/W2.png');
      this.load.image('W3', 'pics/W3.png');
      this.load.image('W4', 'pics/W4.png');
      this.load.image('W5', 'pics/W5.png');
      this.load.image('W6', 'pics/W6.png');
      this.load.audio('tapSound', 'sounds/tap.mp3');
      this.load.audio('toiletSound', 'sounds/toilet.mp3');
      this.load.audio('showerSound', 'sounds/shower.mp3');
      this.load.audio('bathtubSound', 'sounds/bath.mp3');
      this.load.audio('dishwasherSound', 'sounds/dishwasher.mp3');
      this.load.audio('washing_machineSound', 'sounds/washmachine.mp3');
      this.load.audio('footstep', 'sounds/walk.mp3');
    }

    function create() {
      window.phaserScene = this;
      this.add.image(400, 300, 'room');

      player = this.physics.add.sprite(400, 300, 'player');
      player.setScale(0.4);
      player.setCollideWorldBounds(true);

      if (loadedGame?.characterPosition) {
        player.setPosition(loadedGame.characterPosition.x, loadedGame.characterPosition.y);
      }

      this.footstepSound = this.sound.add('footstep');
      this.input.keyboard.enabled = true;
      cursors = this.input.keyboard.createCursorKeys();

      const items = [
        { key: 'kitchenSink', x: 112, y: 50, type: 'kitchensink' },
        { key: 'toilet', x: 646, y: 326, type: 'Toilet' },
        { key: 'shower', x: 753, y: 318, type: 'showerHead' },
        { key: 'tubExterior', x: 670, y: 560, type: 'TubExterior' },
        { key: 'dishwasher', x: 41, y: 72, type: 'Dishwasher' },
        { key: 'washerFront', x: 675, y: 263, type: 'WasherFront' },
      ];

      const objects = items.map(item => {
        const obj = this.physics.add.staticSprite(item.x, item.y, item.key);
        obj.type = item.type;
        return obj;
      });

      const walls = [
        { key: 'W1', x: 288, y: 222 },
        { key: 'W2', x: 609, y: 222 },
        { key: 'W3', x: 610, y: 346 },
        { key: 'W4', x: 287, y: 348 },
        { key: 'W5', x: 608, y: 590 },
        { key: 'W6', x: 288, y: 590 },
      ];
      walls.forEach(wall => {
        const wallSprite = this.physics.add.staticImage(wall.x, wall.y, wall.key);
        this.physics.add.collider(player, wallSprite);
      });

      objects.forEach(object => {
        this.physics.add.overlap(player, object, () => {
          if (lastTriggeredObject !== object) {
            lastTriggeredObject = object;
            setClickCount(prev => prev + 1);
            setWaterUsage(prev => {
              const updated = prev + (waterData[object.type] || 0);
              if (updated > dailyLimit) endGame.call(this, 'fail');
              else if (clickCount + 1 === 10 && updated <= dailyLimit) endGame.call(this, 'success');
              return updated;
            });

            const soundKey = {
              'kitchensink': 'tapSound',
              'Toilet': 'toiletSound',
              'showerHead': 'showerSound',
              'TubExterior': 'bathtubSound',
              'Dishwasher': 'dishwasherSound',
              'WasherFront': 'washing_machineSound',
            }[object.type];
            if (soundKey) this.sound.play(soundKey);
          }
        });
      });

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

      if (moving && !this.footstepSound.isPlaying) {
        this.footstepSound.play({ loop: true });
      } else if (!moving && this.footstepSound.isPlaying) {
        this.footstepSound.stop();
      }
    }

    function endGame(result) {
      const message = result === 'fail' ? 'Game Over! You used too much!' : 'Congratulations! You passed!';
      this.add.text(200, 300, message, { fontSize: '32px', fill: '#000' });
      this.scene.pause();
    }

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

      <div className="left-ui">
        <div className="scoreboard-panel">
          <p>Water Usage: {Math.round(waterUsage)}L</p>
          <p>Daily Limit: {Math.round(dailyLimit)}L</p>
          <p>Clicks Left: {10 - clickCount}</p>
          <p>Score: {Math.round(dailyLimit - waterUsage)}L</p>
        </div>
      </div>

      <div className="logout-button-container">
        <button className="logout-button" onClick={() => navigate('/login')}>Log Out</button>
      </div>
      <div className="selection-box">
        <h3>Your water challenge today is based on the average daily consumption for this day in history.</h3>
        <p><strong>{Math.round(dailyLimit)}L</strong> is your target for today.</p>
      </div>
      <div className="game-area" id="game-container" ref={gameContainerRef}></div>
      {isPaused && <div className="trial-popup-overlay"><div className="trial-popup">Paused</div></div>}
      {showHelp && <HelpScreen onClose={() => setShowHelp(false)} />}
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
