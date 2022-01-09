import { Popup, PopupOptions } from "./popup.js";

export interface PhaserPopupParams extends PopupOptions {
    game: Phaser.Game
}

export class PhaserPopup extends Popup {
    constructor(args:PhaserPopupParams) {
        super(args);



        // important:
        //      phaser is receiving clicks through the popup modal container
        //      need to stop propagation to prevent popup clicks from making it to the game
        this.$container.on("mousedown", e => e.stopPropagation())

    }
}
