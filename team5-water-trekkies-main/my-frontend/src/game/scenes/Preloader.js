import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
     
    }

    preload ()
    {
        this.load.image('floor', '/assets/tileset/floor.png'); // Update the path if necessary
        this.load.image('walls', '/assets/tileset/walls.png'); 
         
        }
    

    create ()
    {
       
        this.scene.start('MainMenu');
    }
}
