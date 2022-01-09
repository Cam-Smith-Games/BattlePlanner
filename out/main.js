import { Knight } from "./character/knight.js";
class Game extends Phaser.Scene {
    constructor() {
        super("PlayGame");
        this.characters = [];
    }
    preload() {
        this.load.atlas("knight", "/res/knight.png", "/res/knight.json");
    }
    create() {
        createAnimations(this);
        let y = 0;
        for (let i = 0; i < 8; i++) {
            y += 125;
            const knight1 = new Knight({
                scene: this,
                pos: {
                    x: 100,
                    y: y
                },
                health: {
                    maximum: 20 + (Math.random() * 20)
                }
            });
            const knight2 = new Knight({
                scene: this,
                pos: {
                    x: this.scale.width - 100,
                    y: y
                },
                health: {
                    maximum: 20 + (Math.random() * 20)
                }
            });
            //knight1.target = knight2;
            //knight2.target = knight1;
            this.characters.push(knight1);
            this.characters.push(knight2);
        }
        // making characters collide with other characters
        let characters = this.physics.add.group(this.characters);
        this.physics.add.collider(characters, characters);
    }
    update(_, delta) {
        for (let i = this.characters.length - 1; i > -1; i--) {
            let c = this.characters[i];
            // if character was destroyed, remove from list
            if (!c.scene || !c.body) {
                this.characters.splice(i, 1);
            }
            else {
                c.update(delta, this.characters);
            }
        }
    }
}
function createAnimations(scene) {
    // #region knight
    scene.anims.create({
        key: "knight_idle",
        frames: scene.anims.generateFrameNames('knight', { prefix: "idle", end: 3 }),
        frameRate: 4,
        repeat: -1
    });
    scene.anims.create({
        key: "knight_run",
        frames: scene.anims.generateFrameNames('knight', { prefix: "run", start: 0, end: 5 }),
        frameRate: 8,
        repeat: -1
    });
    scene.anims.create({
        key: "knight_attack",
        frames: scene.anims.generateFrameNames('knight', { prefix: "attack", end: 2 }),
        frameRate: 16
        //repeat: -1
    });
    scene.anims.create({
        key: "knight_death",
        frames: scene.anims.generateFrameNames('knight', { prefix: "death", end: 0 }),
        frameRate: 4
        //repeat: -1
    });
    // #endregion
}
window.onload = function () {
    new Phaser.Game({
        type: Phaser.AUTO,
        backgroundColor: "#050",
        pixelArt: true,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: 1920,
            height: 1080
        },
        physics: {
            default: "arcade",
            arcade: {
                debug: true,
                gravity: {
                    y: 0
                }
            }
        },
        scene: Game
    });
};
//# sourceMappingURL=main.js.map