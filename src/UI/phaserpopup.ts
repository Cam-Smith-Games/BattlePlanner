import { Popup, PopupOptions } from "./popup.js";

export interface PhaserPopupParams extends PopupOptions {
    game: Phaser.Game
}

export class PhaserPopup extends Popup {
    constructor(args:PhaserPopupParams) {
        super(args);

        /*// keeping popup scaled to game screen
        let canvas = args.game.canvas;
        $(window).on("resize", () => {

            let css = {
                "width": canvas.width,
                "height": canvas.height,
                "margin-top": $(canvas).css("margin-top"),
                "margin-left": $(canvas).css("margin-top")
            }; 
          
            this.$container.css(css);
        });*/
    }
}
