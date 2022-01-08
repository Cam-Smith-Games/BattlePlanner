import { AbstractCharacterParams, Character, CharacterParams } from "./_character.js";

export class Knight extends Character {
    
    constructor(p:CharacterParams) {
        var params = <AbstractCharacterParams>p;
        params.texture = "knight";
        params.size = { x: 16, y: 24 };
        params.scale = { x: 5, y: 5 };
        super(params);

        
        this.play("knight_idle");

    }
 
}