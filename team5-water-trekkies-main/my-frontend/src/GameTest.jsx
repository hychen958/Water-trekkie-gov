
import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import './app.css'; // Updated CSS file with matching styles
import { useNavigate } from 'react-router-dom';
const WaterUsageGame = () => {
    const gameContainerRef = useRef(null);
    const [dailyLimit, setDailyLimit] = useState(0);
    const [options, setOptions] = useState([]);
    const navigate = useNavigate();
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
    useEffect(() => {
        if (!dailyLimit) return;
        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameContainerRef.current,
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false,
                },
            },
            scene: {
                preload,
                create,
                update,
            },
        };
        const game = new Phaser.Game(config);
        let player, cursors, waterUsageText, clickCountText, dailyLimitText, scoreText;
        let waterUsage = 0;
        let clickCount = 0;
        const waterData = {
            Tap: 12,
            'Low-flow toilet': 6,
            'Low-flow showerhead': 40,
            Bathtub: 80,
            Dishwasher: 35,
            'Front-load washing machine': 65,
            'Watering lawn': 950,
        };
        function preload() {
            this.load.image('player', 'char1.png');
            this.load.image('room', 'room.jpg');
            this.load.image('tap', 'tap.png');
            this.load.image('toilet', 'toilet.png');
            this.load.image('shower', 'shower.png');
            this.load.image('bathtub', 'bathtub.png');
            this.load.image('dishwasher', 'dishwasher.png');
            this.load.image('washing_machine', 'washmachine.png');
            this.load.image('lawn', 'lawn.png');
        }
        function create() {
            this.add.image(400, 300, 'room');
            player = this.physics.add.sprite(400, 300, 'player');
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
            // Display UI texts
            waterUsageText = this.add.text(10, 10, 'Water Usage: 0L', { fontSize: '16px', fill: '#000' });
            dailyLimitText = this.add.text(10, 30, `Daily Limit: ${dailyLimit}L`, { fontSize: '16px', fill: '#000' });
            scoreText = this.add.text(10, 50, 'Score: 0', { fontSize: '16px', fill: '#000' });
            clickCountText = this.add.text(10, 70, 'Clicks Left: 10', { fontSize: '16px', fill: '#000' });
        }
        function update() {
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
            const message =
                result === 'fail'
                    ? 'Game Over! You used too much!'
                    : 'Congratulations! You passed!';
            this.add.text(200, 300, message, { fontSize: '32px', fill: '#000' });
            this.scene.pause();
        }
        return () => {
            game.destroy(true);
        };
    }, [dailyLimit]);
    return (
        <div className="water-game-container">
            <div className="logout-button-container">
                <button
                    className="logout-button"
                    onClick={() => navigate('/login')}
                >
                    Log Out
                </button>
            </div>
            <div className="selection-box">
                <label className="title">Select Daily Consumption Limit:</label>
                <h3>
                    Water consumption was bad in the old days - easy game level. For challenge, choose the most current dates to see how you compare with your neighbors!
                </h3>
                <select
                    className="dropdown"
                    onChange={e => setDailyLimit(Number(e.target.value))}
                >
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
                <button
                    className="main-menu-button"
                    onClick={() => navigate('/menu')}
                >
                    Main Menu
                </button>
            </div>
        </div>
    );
};
export default WaterUsageGame;
