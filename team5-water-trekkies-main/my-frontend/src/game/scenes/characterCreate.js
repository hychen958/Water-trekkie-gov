export class characterCreate extends Phaser.Scene {
  constructor() {
    super({ key: 'characterCreate' });
  }

  preload() {
   
  }

  create() {
    
  }

  showConfirmation(character, onConfirm) {
    const modal = this.add.rectangle(400, 300, 400, 200, 0x000000).setAlpha(0.8);
    const modalText = this.add.text(400, 250, `Did you mean to select ${character}?`, {
      fontSize: '18px',
      color: '#fff',
    }).setOrigin(0.5);

    const yesButton = this.add.text(350, 350, 'Yes', { fontSize: '24px', color: '#0f0' })
      .setInteractive()
      .on('pointerdown', () => {
        modal.destroy();
        modalText.destroy();
        yesButton.destroy();
        noButton.destroy();
        onConfirm();
      });

    const noButton = this.add.text(450, 350, 'No', { fontSize: '24px', color: '#f00' })
      .setInteractive()
      .on('pointerdown', () => {
        modal.destroy();
        modalText.destroy();
        yesButton.destroy();
        noButton.destroy();
      });
  }
}

