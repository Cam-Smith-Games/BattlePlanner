import { Popup } from "./popup.js";
export class PhaserPopup extends Popup {
    constructor(args) {
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
//# sourceMappingURL=phaserpopup.js.map