export var CharacterStates;
(function (CharacterStates) {
    CharacterStates[CharacterStates["IDLE"] = 0] = "IDLE";
    CharacterStates[CharacterStates["RUNNING"] = 1] = "RUNNING";
    CharacterStates[CharacterStates["ATTACKING"] = 2] = "ATTACKING";
    CharacterStates[CharacterStates["DYING"] = 3] = "DYING";
})(CharacterStates || (CharacterStates = {}));
export class Character extends Phaser.GameObjects.Sprite {
    // TODO: team attribute? for acquiring target
    constructor(p) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        super(p.scene, ((_a = p.pos) === null || _a === void 0 ? void 0 : _a.x) || 0, ((_b = p.pos) === null || _b === void 0 ? void 0 : _b.y) || 0, p.texture);
        p.scene.add.existing(this);
        p.scene.physics.add.existing(this);
        this.setSize(((_c = p.size) === null || _c === void 0 ? void 0 : _c.x) || 32, ((_d = p.size) === null || _d === void 0 ? void 0 : _d.y) || 32);
        this.setScale(((_e = p.scale) === null || _e === void 0 ? void 0 : _e.x) || 1, ((_f = p.scale) === null || _f === void 0 ? void 0 : _f.y) || 1);
        this.health = new Power((_g = p === null || p === void 0 ? void 0 : p.health) === null || _g === void 0 ? void 0 : _g.current, (_h = p === null || p === void 0 ? void 0 : p.health) === null || _h === void 0 ? void 0 : _h.maximum);
        this.target = null;
        this.damage = 5;
        this.range = (_j = p.range) !== null && _j !== void 0 ? _j : 0;
        this.speed = 400;
        this.bar = new Phaser.GameObjects.Graphics(this.scene);
        this.scene.add.existing(this.bar);
    }
    isTargetWithinRange() {
        if (this.target) {
            // padding by 1 because distance is usually like 0.001 over desired range
            return this.dist(this.target) <= this.range + Math.max(this.displayHeight, this.displayWidth) + 1;
        }
        return false;
    }
    // shortcut for long ass BetweenPoints function name
    dist(c) {
        return Phaser.Math.Distance.BetweenPoints(this, c);
    }
    // when character is destroyed, need to destroy bar object too
    destroy() {
        this.bar.destroy();
        super.destroy();
    }
    // i figured there'd be an "Events.STATE_CHANGE" event to listen to with GameObject.on(event, func)... but i couldnt find it
    //  my solution is to just override setState and do the logic here
    setState(state) {
        // state already active ? do nothing
        if (state == this.state)
            return this;
        // does super.setState wait until next frame?
        super.setState(state);
        if (state == CharacterStates.DYING) {
            console.log("DYING");
        }
        if (state == CharacterStates.RUNNING) {
            // if target, walk towards it
            if (this.target) {
                // if already facing left, keep facing left until positive x velocity (<= 0).
                // otherwise, only face left when negative x velocity (< 0)
                this.flipX = this.flipX ? this.body.velocity.x <= 0 : this.body.velocity.x < 0;
                this.play("knight_run", true);
            }
            // no target? shouldn't have been set to RUNNING... go back to IDLE
            else {
                return this.setState(CharacterStates.IDLE);
            }
        }
        else {
            // not running -> stand still
            if (this.body) {
                this.body.velocity.x = 0;
                this.body.velocity.y = 0;
            }
            if (state == CharacterStates.DYING) {
                this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                    this.destroy();
                });
                this.play("knight_death", true);
            }
            else if (state == CharacterStates.ATTACKING) {
                if (this.target) {
                    // deal damage when animation is complete
                    // TODO: ranged characters will spawn bullet on animation complete, and not deal damage. damage will be dealt by bullet instead
                    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                        if (this.state != CharacterStates.DYING) {
                            // target might have moved out of range while attacking, so need to check again
                            if (this.isTargetWithinRange()) {
                                this.target.health.current -= this.damage;
                                if (this.health.current <= 0) {
                                    console.log("not dying, but health <= 0!!!!!");
                                }
                                if (this.target.health.current <= 0) {
                                    this.target.setState(CharacterStates.DYING);
                                    this.target = null;
                                }
                            }
                            this.setState(CharacterStates.IDLE);
                        }
                    });
                    this.play("knight_attack");
                }
                // no target? shouldn't have been set to ATTACKING... go back to IDLE
                else {
                    return this.setState(CharacterStates.IDLE);
                }
            }
            else {
                this.play("knight_idle", true);
            }
        }
        return this;
    }
    update(_, characters) {
        if (this.health.current <= 0) {
            this.setState(CharacterStates.DYING);
        }
        else if (this.state != CharacterStates.DYING) {
            if (this.target) {
                if (this.state != CharacterStates.ATTACKING) {
                    if (this.isTargetWithinRange()) {
                        this.setState(CharacterStates.ATTACKING);
                    }
                    else {
                        if (this.target) {
                            this.scene.physics.moveToObject(this, this.target, this.speed);
                        }
                        this.setState(CharacterStates.RUNNING);
                    }
                }
            }
            else {
                // idle ? try to pick new target
                // TODO: target logic (i.e. pick lowest hp vs pick nearest etc)
                if (characters.length) {
                    // getting closest character (that has not been destroyed yet)
                    this.target = characters
                        .filter(c => c.scene && c.health.current > 0 && c != this)
                        .sort((a, b) => this.dist(a) - this.dist(b))[0];
                    if (this.target) {
                        this.setState(CharacterStates.RUNNING);
                        console.log("acquired target: ", this.target);
                    }
                }
                if (!this.target) {
                    this.setState(CharacterStates.IDLE);
                }
            }
        }
        // #region rendering health bar
        this.bar.clear();
        // background
        this.bar.fillStyle(0x000000);
        this.bar.fillRect(this.x - this.displayWidth / 2, this.y - this.displayHeight / 2 - 20, this.displayWidth, 16);
        // health (padding = 2)
        this.bar.fillStyle(0x00ff00);
        this.bar.fillRect(this.x + 2 - (this.displayWidth / 2), this.y + 2 - (this.displayHeight / 2) - 20, (this.displayWidth - 4) * this.health.ratio, 12);
        // #endregion
    }
}
class Power {
    constructor(current, maximum) {
        this.maximum = Math.max(0, maximum || 100);
        this.current = Math.min(this.maximum, current !== null && current !== void 0 ? current : this.maximum);
    }
    /** ratio of current health to maximum(note: 0 to 1) */
    get ratio() {
        return Math.min(1, Math.max(0, this.current / this.maximum));
    }
}
//# sourceMappingURL=_character.js.map