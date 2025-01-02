// Main window
"use strict";
// globals: document, requestAnimationFrame, window, setInterval, FuriganaBrowser, setTimeout

var SC = window.SC || {}
SC.walls = true;

// duplicate tiles for single tile characters
SC.characters.singleTileCharacter('waterfront');
SC.characters.singleTileCharacter('invisible');
SC.characters.singleTileCharacter('crystals');

SC.customLoop = function () {
    // Custom rendering loop
    if (SC.background.map) {
        SC.render();
    }
    // loop itself
    requestAnimationFrame(SC.customLoop);
};

SC.onHerb = function () {
    // Use medicinal herb to heal itself
    if (SC.characters.player) {
        if (SC.characters.player.herb > 0 && SC.characters.player.health < 100) {
            SC.characters.player.herb--;
            SC.characters.player.health = 100;
            document.getElementById('herbbutton').innerText = SC.characters.player.herb;
            SC.sound.play('herb');
        }
    }
};

SC.onAttack = function (event) {
    // Attack nearest enemy
    if (SC.mission.major === 11) {
        // wand sound
        SC.sound.play('wand');
    } else {
        // play random knife sound
        SC.sound.play('knife' + Math.ceil(Math.random() * 4));
    }
    // animate punch
    SC.effects.attack(SC.characters.player);
    // find nearest enemy
    var near = SC.characters.nearest(SC.characters.player, {"slime": 1, "frog": 1, "crystals": 1, "ghost": 1, "skeleton": 1, "bat": 1, "spider": 1, "rat": 1}, 1.5, true);
    if (near) {
        // hit enemy (take 40 health, except in ghost mission take as much to kill ghost in 30 hits)
        near.health -= SC.mission.major >= 11 ? SC.characters.defaults.ghost.health / 30 : 40;
        // animate hit
        SC.effects.hit(near);
        // did it died?
        if (near.health <= 0) {
            near.turn('dead');
            SC.mission.sort();
            // undead fix
            setTimeout(function () {
                near.updateTile(SC.time);
            }, 500);
            setTimeout(function () {
                near.updateTile(SC.time);
            }, 1500);
            // sound
            if (SC.sound.sound.hasOwnProperty(near.baseTile)) {
                SC.sound.play(near.baseTile);
            }
        }
    }
    // prevent double attack with mouse/touch
    event.cancelBubble = true;
    event.preventDefault();
};

SC.onAttackSpace = function (event) {
    // Space attacks (if I have dagger)
    //console.warn(event.keyCode);
    // alt, space, j
    if (SC.keyboard.touchpad && (SC.mission.major >= 2) && (event.keyCode === 32 || event.keyCode === 18 || event.keyCode === 225 || event.keyCode === 74)) {
        event.preventDefault();
        SC.onAttack(event);
    }
    // h herb
    if (SC.keyboard.touchpad && (event.keyCode === 72)) {
        event.preventDefault();
        SC.onHerb();
    }
    // prevent moving down
    if (SC.keyboard.touchpad && (event.keyCode === 32)) {
        event.preventDefault();
    }
};

SC.die = function () {
    // Player death
    SC.sound.play('argh');
    SC.characters.player.bubble = "Aaargh..";
    SC.characters.player.turn('dead');
    // disable controls
    SC.keyboard.touchpad = false;
    SC.touchpad.x = 0;
    SC.touchpad.y = 0;
    SC.touchpad.hide();
    // game over
    setTimeout(function () {
        SC.characters.player.bubble = "";
        SC.mission.gameOver();
    }, 2000);
};

SC.onMenu = function () {
    // Show main menu
    function missionLabel(aMajor, aSubtitle) {
        if (aMajor <= 1 || SC.storage.readBoolean('SC.mission.unlock.' + (aMajor - 1), false)) {
            return 'Replay mission ' + aMajor + '\n' + aSubtitle;
        }
        return 'Mission ' + aMajor + '\nLocked';
    }

    // special console
    var con = SC.storage.readBoolean('SC.console', false) || (SC.characters.player.x === 6 && SC.characters.player.y === 6 && SC.characters.player.map === 'gallery3');

    SC.game_menu('Ghost town 2', 'Monster survival', [
        missionLabel(0, 'Introduction'),
        missionLabel(1, 'Getting dagger'),
        missionLabel(2, 'Deliver fish to Jane'),
        missionLabel(3, 'Find herb'),
        missionLabel(4, 'Bring herb back'),
        missionLabel(5, 'Visit fisherman'),
        missionLabel(6, 'Fix dry river'),
        missionLabel(7, 'Tell mayor about Ghost'),
        missionLabel(8, 'Visit surveyor'),
        missionLabel(9, 'Find 3 crystals'),
        missionLabel(10, 'Go to cemetery'),
        missionLabel(11, 'Kill Ghost'),
        missionLabel(12, 'Return book to Mayor')
        ],
        function (aTitle, aTitleSubtitle, aSubtitle) {
            console.log('button', aTitle, 'ts', aTitleSubtitle, 's', aSubtitle);
            if (aSubtitle === 'Locked') {
                return;
            }
            var m = parseInt(aTitle.replace('Replay mission', '').replace('Mission ', ''), 10);
            console.log('mission', m, aTitleSubtitle, aSubtitle);
            if (m >= 0) {
                SC.mission.reset(m);
            }
        }
        );
};

function go(aPlace, aDx, aDy) {
    // Go to a place (used many times during development)
    // first look on current map
    var m, p, xy;
    try {
        p = SC.mission.placeOrNpc(SC.characters.player.map, aPlace);
        if (p) {
            SC.characters.player.teleport(p.map, p.x + (aDx || 0), p.y + (aDy || 0));
            return;
        }
        // then on all maps
        for (m in SC.maps) {
            if (SC.maps.hasOwnProperty(m)) {
                p = SC.mission.placeOrNpc(m, aPlace);
                if (p) {
                    SC.characters.player.teleport(p.map, p.x + (aDx || 0), p.y + (aDy || 0));
                    return;
                }
            }
        }
    } catch (e) {
        // then just first place on map
        if (SC.maps.hasOwnProperty(aPlace)) {
            xy = Object.keys(SC.maps[aPlace].place)[0].split(' ');
            SC.characters.player.teleport(aPlace, parseInt(xy[0], 10) + (aDx || 0), parseInt(xy[1], 10) + (aDy || 0));
            return;
        }
    }
}

function test() {
    // Start test mission
    SC.mission.major = 20;
    SC.mission.save();
    document.location.reload();
}

function purge() {
    // Erase storage and reload app
    SC.storage.eraseAll();
    document.location.reload();
}

function fwd() {
    // Show fwd button
    SC.storage.writeBoolean('SC.fwd', true);
    document.location.reload();
}

function walls() {
    // Turn walls on/off
    SC.walls = !SC.walls;
    SC.characters.player.wallhack(!SC.walls);
}

// initialize window
window.addEventListener('DOMContentLoaded', function () {
    try {
        // buttons
        document.getElementById('minimap').addEventListener('click', SC.mission.minimap);
        document.getElementById('attack').addEventListener('touchstart', SC.onAttack);
        document.getElementById('attack').addEventListener('mousedown', SC.onAttack);
        document.getElementById('herb').addEventListener('touchstart', SC.onHerb);
        document.getElementById('herb').addEventListener('mousedown', SC.onHerb);
        window.addEventListener('keydown', SC.onAttackSpace, true);
        document.getElementById('objective').addEventListener('click', SC.onMenu);

        SC.sound.add('knife1', 3);
        SC.sound.add('knife2', 3);
        SC.sound.add('knife3', 3);
        SC.sound.add('knife4', 3);
        SC.sound.add('wand', 6);

        SC.sound.add('argh', 2);
        SC.sound.add('herb', 2);
        SC.sound.add('magic', 2);
        SC.sound.add('hit', 3);

        SC.sound.add('bat', 3);
        SC.sound.add('frog', 3);
        SC.sound.add('ghost', 3);
        SC.sound.add('rat', 3);
        SC.sound.add('skeleton', 3);
        SC.sound.add('slime', 3);
        SC.sound.add('spider', 3);

        SC.sound.add('crystals', 3);

        SC.sound.add('bat-attack-1', 3);
        SC.sound.add('bat-attack-2', 3);
        SC.sound.add('frog-attack-1', 3);
        SC.sound.add('frog-attack-2', 3);
        SC.sound.add('ghost-attack-1', 3);
        SC.sound.add('ghost-attack-2', 3);
        SC.sound.add('rat-attack-1', 3);
        SC.sound.add('rat-attack-2', 3);
        SC.sound.add('skeleton-attack-1', 3);
        SC.sound.add('skeleton-attack-2', 3);
        SC.sound.add('slime-attack-1', 3);
        SC.sound.add('slime-attack-2', 3);
        SC.sound.add('spider-attack-1', 3);
        SC.sound.add('spider-attack-2', 3);

        SC.init(function () {
            // initialize canvas
            SC.canvas.init('background_canvas', 'character_canvas');

            // initialize on-screen touchpad
            SC.touchpad = SC.touchpad('image/arrows130.png', undefined, true);
            SC.touchpad.img.style.zIndex = 10;

            // hide touchpad on desktop
            if (!SC.isTouchDevice()) {
                SC.touchpad.hide();
                SC.touchpad.hide = function () { console.log('SC.touchpad.hide suppressed'); };
                SC.touchpad.show = function () { console.log('SC.touchpad.show suppressed'); };
            }

            // rendering loop
            SC.customLoop();

            // start last mission
            SC.mission.run();
        });

        // update healthbar
        var health = document.getElementById('health');
        setInterval(function () {
            if (SC.characters.player) {
                health.value = SC.characters.player.health;
            }
        }, 200);

        // show fwd button only when enabled
        document.getElementById('fwd').style.visibility = SC.storage.readBoolean('SC.fwd', false) ? 'visible' : 'hidden';

    } catch (e) {
        alert(e);
    }
});

