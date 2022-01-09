import { Popup } from "./popup.js";
export class PhaserPopup extends Popup {
    constructor(args) {
        super(args);
        // important:
        //      phaser is receiving clicks through the popup modal container
        //      need to stop propagation to prevent popup clicks from making it to the game
        this.$container.on("mousedown", e => e.stopPropagation());
    }
}
//# sourceMappingURL=phaserpopup.js.map