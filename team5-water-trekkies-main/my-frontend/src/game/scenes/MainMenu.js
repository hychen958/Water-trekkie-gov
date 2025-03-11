export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }


  create() {
    this.add.text(400, 100, 'Main Menu', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);

    const startGameButton = this.add.text(400, 200, 'Start Game', { fontSize: '24px', color: '#0f0' })
      .setInteractive()
      .on('pointerdown', () => this.scene.start('characterCreate')); // Start a new game

    const continueGameButton = this.add.text(400, 300, 'Continue Game', { fontSize: '24px', color: '#0f0' })
      .setInteractive()
      .on('pointerdown', () => {
        // Load the saved game data if available, or proceed to Game.js
        console.log('Continue Game');
        this.scene.start('Game'); // Transition to Game.js scene
      });

    const settingsButton = this.add.text(400, 400, 'Settings', { fontSize: '24px', color: '#0f0' })
      .setInteractive()
      .on('pointerdown', () => {
        console.log('Settings');
        // Add functionality for the settings scene
      });

      const helpButton = this.add.text(400, 500, 'Help', { fontSize: '24px', color: '#0f0' })
      .setInteractive()
      .on('pointerdown', () => {
        console.log('Settings');
        // Add functionality for the settings scene
      });

    startGameButton.setOrigin(0.5);
    continueGameButton.setOrigin(0.5);
    settingsButton.setOrigin(0.5);
    helpButton.setOrigin(0.5);

  }
  changeScene ()
  {
      if (this.logoTween)
      {
          this.logoTween.stop();
          this.logoTween = null;
      }

      this.scene.start('Game');
  }
  
}
