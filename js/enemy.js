// Managing generic enemies
"use strict";
// globals: document, window, setTimeout, setInterval

var SC = window.SC || {};

SC.enemy = (function () {
    // Manager of AI enemies
    var self = {};

    self.randomPath = function (aMaxLength, aDir) {
        // Return random path of given length, not suddenly back, e.g. "lLuUuUrR"
        var l = Math.floor(aMaxLength * Math.random()),
            t = {l: 'llud', r: 'rrud', u: 'uulr', d: 'ddlr', s: 'lrud'},
            p = '',
            c,
            i;
        if (l > 0) {
            c = (aDir ? t[aDir.charAt(0)] : 'lrud').charAt(Math.floor(4 * Math.random()));
            p += c + c.toUpperCase();
            for (i = 0; i < l; i++) {
                c = t[c].charAt(Math.floor(4 * Math.random()));
                p += c + c.toUpperCase();
            }
        }
        return p;
    };

    self.onUpdate = function (aCharacter) {
        // Attack nearby player or graze, used in character.onUpdate
        var d, dx, dy, dt, p;

        // if dead don't move
        if (aCharacter.health <= 0) {
            return;
        }
        // only on the same map as player
        if (aCharacter.map !== SC.characters.player.map) {
            return;
        }

        // Initialization
        if (!aCharacter.basicInitialized) {
            aCharacter.basicInitialized = true;
            aCharacter.basicThen = Date.now();
            // Every 3-13 seconds move randomly
            aCharacter.grazingTime = Math.ceil(2 + Math.random() * 10);
        }

        // Don't run too often
        aCharacter.basicNow = Date.now();
        if (aCharacter.basicNow - aCharacter.basicThen > 600) {
            // remember last update time
            dt = aCharacter.basicNow - aCharacter.basicThen;
            aCharacter.basicThen = aCharacter.basicNow;
            // find distance and location of player
            d = aCharacter.distanceTo(SC.characters.player.x, SC.characters.player.y);
            aCharacter.basicDistance = d;
            // if player too far don't move
            if (d > 10) {
                return;
            }
            // only follow/attack player if player is still alive and controls are visible
            if (SC.characters.player.health > 0 && SC.mission.controls) {
                // attack if player is within 1 cell
                if (d < 1.5) {
                    // stop grazing
                    self.onStopWalkPath = undefined;
                    // attack
                    SC.effects.attack(aCharacter);
                    SC.effects.hit(SC.characters.player);
                    SC.sound.play(aCharacter.baseTile + '-attack-' + Math.ceil(Math.random() * 2));
                    /*
                    if (SC.sound.sound.hasOwnProperty(aCharacter.baseTile + '-attack')) {
                        SC.sound.play(aCharacter.baseTile + '-attack');
                    } else {
                        SC.sound.play('hit');
                    }
                    */
                    SC.characters.player.health -= 5;
                    if (SC.characters.player.health <= 0) {
                        SC.die();
                    }
                }
                // if player is nearby move towards him
                if (d <= 3) {
                    dx = SC.characters.player.rx - aCharacter.rx;
                    dy = SC.characters.player.ry - aCharacter.ry;
                    if (dx > 0) {
                        aCharacter.gotoRight();
                    }
                    if (dx < 0) {
                        aCharacter.gotoLeft();
                    }
                    if (dy > 0) {
                        aCharacter.gotoDown();
                    }
                    if (dy < 0) {
                        aCharacter.gotoUp();
                    }
                    return;
                }
            }

            // stay in area (if set)
            if (aCharacter.area) {
                if (aCharacter.x < aCharacter.area.x1) {
                    aCharacter.gotoRight();
                } else if (aCharacter.x > aCharacter.area.x2) {
                    aCharacter.gotoLeft();
                } else if (aCharacter.y < aCharacter.area.y1) {
                    aCharacter.gotoDown();
                } else if (aCharacter.y > aCharacter.area.y2) {
                    aCharacter.gotoUp();
                }
            }

            // grazing
            aCharacter.grazingTime -= dt / 1000;
            if (aCharacter.grazingTime <= 0) {
                // only if player is not very close
                if (aCharacter.basicDistance > 2) {
                    // walk random path
                    p = self.randomPath(4, aCharacter.dir);
                    aCharacter.walkPath(p);
                }
                // set new grazing time
                aCharacter.grazingTime = Math.ceil(2 + Math.random() * 10);
            }
        }
    };

    return self;
}());

