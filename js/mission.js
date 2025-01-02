// Mission functions and all missions
"use strict";
// globals: document, window, setTimeout, setInterval

var SC = window.SC || {}

SC.missions = SC.missions || {};

SC.mission = (function () {
    // Mission functions
    var self = {};
    self.major = SC.storage.readNumber('SC.mission.major', 0);
    self.missions = {};
    self.currentObjective = '';

    // set character defaults
    SC.characters.defaults.bat = { health: 120 };
    SC.characters.defaults.skeleton = { health: 500 };
    SC.characters.defaults.spider = { health: 150 };
    SC.characters.defaults.frog = { health: 100 };
    SC.characters.defaults.slime = { health: 300 };
    SC.characters.defaults.rat = { health: 50 };
    SC.characters.defaults.ghost = { health: 99999 };

    self.save = function () {
        // Save mission progress
        SC.storage.writeNumber('SC.mission.major', self.major);
    };

    self.reset = function (aMajor) {
        // Reset to another mission and reload
        self.major = typeof aMajor === 'number' ? aMajor : 0;
        self.save();
        document.location.reload();
    };

    self.next = function () {
        // Run next mission
        self.major++;
        self.save();
        console.log('Next major is ' + self.major);
        self.run();
    };

    self.run = function () {
        // Run current mission
        console.info('SC.mission.run', self.major);
        if (!SC.missions.hasOwnProperty(self.major)) {
            throw "Unknown mission " + self.major;
        }
        SC.missions[self.major]();
    };

    // mission objective checker
    self.checkObjective = undefined;
    setInterval(function () {
        if (self.checkObjective && !SC.pause) {
            self.checkObjective();
        }
    }, 1000);

    self.objective = function (aSubtitle, aTitle) {
        // Change mission objective label
        var o = document.getElementById('objective'),
            h1 = document.getElementById('objective_title'),
            h2 = document.getElementById('objective_subtitle');
        h1.textContent = aTitle || "Objective";
        h2.textContent = aSubtitle;
        self.currentObjective = aSubtitle;
        if (!aSubtitle) {
            o.style.visibility = 'hidden';
        }
    };

    self.placeOrNpc = function (aMap, aPlaceOrNpc) {
        // Return place, if there is no such place try npc by the same name
        var p = SC.places.byName[aMap + ' ' + aPlaceOrNpc];
        if (!p) {
            p = SC.maps[aMap].npc[aPlaceOrNpc];
        }
        return p;
    };

    self.destination = function (aMap, aPlace, aDistance, aCallback) {
        // Set objective to be given destination
        console.log('Setting destination objective', aMap, aPlace, aDistance);
        SC.mission.checkObjective = function () {
            var pp, d;
            // must be on the same map
            if (SC.characters.player.map !== aMap) {
                return;
            }
            pp = self.placeOrNpc(aMap, aPlace);
            d = SC.characters.player.distanceTo(pp.x, pp.y);
            //console.log('destination', aMap + ' ' + aPlace, 'd', d, 'limit', aDistance);
            if (d <= aDistance) {   // && SC.mission.enemiesAlive(SC.mission.enemies) <= 0
                self.checkObjective = undefined;
                self.objective('');
                if (aCallback) {
                    aCallback(aMap, aPlace, aDistance);
                }
            }
        };
    };

    self.randomEnemies = function (aMap, aX1, aY1, aX2, aY2, aBase, aAmount, aOnUpdateCallback) {
        // Create random enemies in given rectangle
        var e = [], i, x, y, j, c;
        for (i = 0; i < aAmount; i++) {
            // do not summon them on nowalk area
            for (j = 0; j < 20; j++) {
                x = Math.floor(aX1 + (aX2 - aX1) * Math.random());
                y = Math.floor(aY1 + (aY2 - aY1) * Math.random());
                if (SC.map.walkableTileInCell(SC.maps[aMap], x, y)) {
                    break;
                }
            }
            // enemy
            c = SC.character(SC.characters.uid(), aMap, x, y, aBase);
            c.acceptEvents = false;
            e.push(c);
            // callback for single enemy
            c.onUpdate = aOnUpdateCallback;
        }
        return e;
    };

    self.enemy = function (aMap, aX, aY, aBase, aOnUpdateCallback) {
        // Create single enemy
        self.randomEnemies(aMap, aX, aY, aX, aY, aBase, 1, aOnUpdateCallback);
    };

    self.enemiesAlive = function (aEnemies) {
        // Return number of alive enemies
        var i, a = 0;
        for (i = 0; i < aEnemies.length; i++) {
            if (aEnemies[i].health > 0) {
                a++;
            }
        }
        return a;
    };

    self.gameOver = function () {
        // Show game over and restart game
        var g = SC.gallery('image/mission/gameover.png', '', '', function () {
            document.location.reload();
        }, true);
        if (g) {
            g.style.imageRendering = 'optimizespeed';
            g.style.imageRendering = 'pixelated';
        }
    };

    self.setForward = function (aMap, aPlace, aDx, aDy) {
        // Set forward button callback
        var pp = self.placeOrNpc(aMap, aPlace);
        console.log('Forward place', pp);
        SC.mission.forward = function () {
            SC.characters.player.teleport(aMap, pp.x + (aDx || 0), pp.y + (aDy || 0), 'down');
        };
        document.getElementById('fwd').onclick = SC.mission.forward;
    };

    self.controlsHide = function () {
        // Hide controls
        self.controls = false;
        SC.touchpad.hide();

        SC.keyboard.touchpad = false;
        SC.keyboard.key = {};
        if (SC.characters && SC.characters.player) {
            SC.characters.player.goto(SC.characters.player.x, SC.characters.player.y, SC.characters.player.dir);
        }
        SC.touchpad.x = 0;
        SC.touchpad.y = 0;

        document.getElementById('objective').style.visibility = 'hidden';
        document.getElementById('attack').style.visibility = 'hidden';
        document.getElementById('minimap').style.visibility = 'hidden';
        document.getElementById('health').style.visibility = 'hidden';
        document.getElementById('herb').style.visibility = 'hidden';
    };

    self.controlsShow = function () {
        // Show controls
        self.controls = true;
        SC.keyboard.touchpad = true;
        SC.touchpad.show();
        // dagger only visible in missions 2 to 11
        if (self.major >= 2 && self.major <= 11) {
            document.getElementById('attack').style.visibility = 'visible';
        }
        document.getElementById('minimap').style.visibility = 'visible';
        document.getElementById('objective').style.visibility = self.currentObjective ? 'visible' : 'hidden';
        document.getElementById('health').style.visibility = 'visible';
        document.getElementById('herb').style.visibility = SC.characters.player.herb > 0 ? 'visible' : 'hidden';
        document.getElementById('herbbutton').textContent = SC.characters.player.herb;
        self.sort();
    };

    self.playerSave = function () {
        // Save player's position before the end of the mission
        var o = {
            map: SC.characters.player.map,
            x: SC.characters.player.x,
            y: SC.characters.player.y,
            dir: SC.characters.player.dir,
            herb: SC.characters.player.herb
        };
        SC.storage.writeObject('SC.mission.player', o);
    };

    self.playerLoad = function (aMaxDistance) {
        // Restore player's position at the begining of the mission
        var o = SC.storage.readObject('SC.mission.player', {}),
            p = SC.characters.player;
        if (o.map === p.map && o.x && o.y && o.dir && (p.distanceTo(o.x, o.y) <= aMaxDistance)) {
            p.teleport(o.map, o.x, o.y, o.dir);
        }
        SC.characters.player.herb = o.herb || 0;
    };

    self.unlock = function () {
        // Mark current mission as unlocked
        SC.storage.writeBoolean('SC.mission.unlock.' + self.major, true);
    };

    self.begin = function (aMap, aPlace, aMinDistance) {
        // Standard mission begin
        self.controlsHide();
        // create player
        SC.characters.clear();
        self.enemies = [];
        var p = self.placeOrNpc(aMap, aPlace), a, b;
        SC.character('Player', aMap, p.x, p.y, 'boy').setPlayer();
        self.playerLoad(aMinDistance || 2);
        SC.background.load(aMap);
        SC.background.key = '';
        // make player collects herbs
        window.player = SC.characters.player;
        SC.characters.player.onWalk = function (c) {
            var he;
            if (SC.maps[c.map].ground[c.y][c.x].indexOf('herb-ground') >= 0) {
                SC.sound.play('herb');
                SC.map.change(c.map, c.x, c.y, ['grass1']);
                if (SC.characters.player.herb <= 0) {
                    SC.characters.player.herb = 0;
                }
                SC.characters.player.herb++;
                // show number of herbs
                he = document.getElementById('herbbutton');
                he.innerText = SC.characters.player.herb;
                he.style.visibility = 'visible';
            }
        };
        // make sure herbs are planted since mission 5 (both quarry and garden)
        if (self.major >= 5) {
            // garden
            a = SC.mission.placeOrNpc('ghosttown', 'garden_origin');
            b = SC.mission.placeOrNpc('ghosttown', 'garden_end');
            SC.map.changeArea('ghosttown', a.x, a.y, b.x, b.y, ['grass1', 'herb-ground']);
        }
        // quarry
        a = SC.mission.placeOrNpc('ghosttown', 'herb');
        SC.map.change('ghosttown', a.x - 1, a.y, ['grass1', 'herb-ground']);
        SC.map.change('ghosttown', a.x, a.y, ['grass1', 'herb-ground']);
        SC.map.change('ghosttown', a.x + 1, a.y, ['grass1', 'herb-ground']);
        SC.map.change('ghosttown', a.x, a.y + 1, ['grass1', 'herb-ground']);
    };

    self.end = function (aCallback) {
        // Save players position, do something or move to next mission
        self.controlsHide();
        self.playerSave();
        self.unlock(self.major);
        if (typeof aCallback === 'function') {
            aCallback();
        } else {
            setTimeout(self.next, 500);
        }
    };

    self.npc = function (aName, aMap, aPlace, aBase, aDir, aCallback) {
        // Create one npc
        var p = self.placeOrNpc(aMap, aPlace),
            ch = SC.character(aName, aMap, p.x, p.y, aBase);
        ch.turn(aDir || 'down');
        if (aCallback) {
            aCallback(ch);
        }
        return ch;
    };

    self.monster = function (aMap, aPlace) {
        // Create one monster from map npc
        var p = self.placeOrNpc(aMap, aPlace),
            b = aPlace.match(/[a-z]+/)[0],
            ch = SC.character(aPlace, aMap, p.x, p.y, b);
        ch.turn('down');
        ch.onUpdate = SC.enemy.onUpdate;
        return ch;
    };

    self.monsters = function (aMap, aBase, aCount) {
        // Create multiple monsters from map npc
        var i;
        for (i = 1; i < aCount; i++) {
            self.monster(aMap, aBase + i);
        }
    };

    self.walk = function (aName, aPath, aCallback, aCallback2) {
        // Walk NPC with given name
        SC.characters.names[aName].walkPath(aPath, aCallback, aCallback2);
    };

    self.chestOpen = function (aMap, aPlace, aCallback) {
        // Animate opening treasure chest
        var p = self.placeOrNpc(aMap, aPlace),
            tiles = SC.maps.library.ground[p.y][p.x],
            i = tiles.indexOf('chest1');
        // remove chest
        if (i > 0) {
            tiles.splice(i, 1);
        }
        // opening
        setTimeout(function () {
            var tiles2 = tiles.slice();
            tiles2.push('chest2');
            SC.map.change('library', p.x, p.y, tiles2);
        }, 400);
        setTimeout(function () {
            var tiles2 = tiles.slice();
            tiles2.push('chest3');
            SC.map.change('library', p.x, p.y, tiles2);
        }, 800);
        setTimeout(function () {
            var tiles2 = tiles.slice();
            tiles2.push('chest4');
            SC.map.change('library', p.x, p.y, tiles2);
        }, 1200);
        // callback after open
        if (typeof aCallback === 'function') {
            setTimeout(aCallback, 1600);
        }
    };

    self.sort = function (aDebug) {
        // Sort optimally characters by their order
        var order = {
            // down
            frog: 1,
            crystals: 1,
            slime: 1,
            spider: 1,
            rat: 1,
            // middle
            girl: 2,
            skeleton: 2,
            // player
            boy: 3,
            // up
            bat: 4,
            ghost: 4
        };
        SC.characters.optimalRenderingOrder(order, aDebug);
    };

    self.defaultEnemies = function () {
        // Place default enemies on the map
        // slimes on square
        SC.mission.randomEnemies('ghosttown', 42, 47, 62, 57, 'slime', 10, SC.enemy.onUpdate);
        // slimes in bank
        SC.mission.enemy('ghosttown', 57, 53, 'slime', SC.enemy.onUpdate);
        SC.mission.enemy('ghosttown', 58, 53, 'slime', SC.enemy.onUpdate);
        SC.mission.enemy('ghosttown', 59, 53, 'slime', SC.enemy.onUpdate);
        // rats near fisherman
        SC.mission.randomEnemies('ghosttown', 64, 47, 68, 67, 'rat', 5, SC.enemy.onUpdate);
        // few frogs near jane's pond and near lake
        SC.mission.enemy('ghosttown', 43, 65, 'frog', SC.enemy.onUpdate);
        SC.mission.enemy('ghosttown', 46, 65, 'frog', SC.enemy.onUpdate);
        SC.mission.enemy('ghosttown', 58, 68, 'frog', SC.enemy.onUpdate);
        SC.mission.enemy('ghosttown', 60, 64, 'frog', SC.enemy.onUpdate);
        // one bat in front of quarry
        SC.mission.enemy('ghosttown', 50, 72, 'bat', SC.enemy.onUpdate);
        // bats in quarry
        SC.mission.enemy('quarry', 4, 4, 'bat', SC.enemy.onUpdate);
        SC.mission.enemy('quarry', 5, 3, 'bat', SC.enemy.onUpdate);
        SC.mission.enemy('quarry', 7, 3, 'bat', SC.enemy.onUpdate);
        SC.mission.enemy('quarry', 8, 2, 'bat', SC.enemy.onUpdate);
        SC.mission.enemy('quarry', 5, 4, 'bat', SC.enemy.onUpdate);
        SC.mission.enemy('quarry', 5, 5, 'bat', SC.enemy.onUpdate);
        SC.mission.enemy('quarry', 5, 6, 'bat', SC.enemy.onUpdate);
        SC.mission.enemy('quarry', 12, 5, 'bat', SC.enemy.onUpdate);
        // crystals in ken basement (so that when player goes there he knows they are there and they can be destroyed)
        if (self.major < 9) {
            SC.mission.npc('Crystals1', 'quarry', 'crystals1', 'crystals');
            SC.mission.npc('Crystals2', 'basement_ken', 'crystals2', 'crystals');
            SC.mission.npc('Crystals3', 'basement_ken', 'crystals3', 'crystals');
        }
        // one bat below quarry
        SC.mission.enemy('ghosttown', 53, 84, 'bat', SC.enemy.onUpdate);
        // spiders in ken's basement
        self.monsters('basement_ken', 'spider', 12);
        // skeletons                                                     // 15
        SC.mission.randomEnemies('ghosttown', 5, 52, 17, 60, 'skeleton', 35, SC.enemy.onUpdate);
        SC.mission.sort();
    };

    self.lightning = function (aCallback) {
        // Flash background 2-3 times
        var e = document.getElementById('background_canvas');
        e.style.transition = 'opacity 0.1s linear';
        setTimeout(function () {
            e.style.opacity = 0;
        }, 1);
        setTimeout(function () {
            e.style.opacity = 1;
        }, 100);
        setTimeout(function () {
            e.style.opacity = 0;
        }, 200);
        setTimeout(function () {
            e.style.opacity = 1;
        }, 300);
        setTimeout(function () {
            e.style.opacity = 0;
        }, 400);
        setTimeout(function () {
            e.style.opacity = 1;
        }, 500);
        setTimeout(function () {
            if (aCallback) {
                aCallback();
            }
        }, 600);
    };

    self.minimap = function (aCallback) {
        // Show current mission minimap
        SC.render();
        SC.galleryMap('image/mission/map' + self.major + '.png', self.currentObjective, typeof aCallback === 'function' ? aCallback : null);
    };

    return self;
}());

// All missions

SC.missions["0"] = function () {
    // Intro
    SC.mission.begin('ghosttown', 'under_throne_left');
    SC.mission.objective('Introduction');
    SC.mission.setForward('ghosttown', 'fisherman', -3, 0);
    SC.mission.npc('Fisherman', 'ghosttown', 'fisherman', 'boy', 'down');
    SC.mission.npc('Mayor', 'ghosttown', 'throne', 'girl', 'down');
    SC.mission.walk('Mayor', 'ppppdDrRdDl', function () {
        SC.bubbles('Mayor',
            ["Hello, I am the Mayor of this town and I need your help",
                "Magic book from town library got lost",
                "Somebody stole it and used it for evil purposes",
                "Dangerous creatures started appearing all over the town",
                "You must stop them! But first you need some weapons",
                "Fisherman Fred will give you dagger, I'll show you where he lives on this map"
                ],
            function () {
                // Walk Mayor back to throne
                SC.mission.walk('Mayor', 'uUlLuUd', SC.mission.end);
            });
    });
};

SC.missions["1"] = function () {
    // Getting to fisherman
    SC.mission.begin('ghosttown', 'under_throne_left');
    SC.mission.objective('Visit fisherman');
    SC.mission.setForward('ghosttown', 'fisherman', -3, 0);
    SC.mission.npc('Fisherman', 'ghosttown', 'fisherman', 'boy', 'down');
    SC.mission.npc('Mayor', 'ghosttown', 'throne', 'girl', 'down');
    // players have trouble getting past first level
    SC.characters.player.health = 150;
    // Show map
    SC.mission.minimap(function () {
        SC.bubbles('Mayor', ['Run as fast as you can!'], function () {
            // show controls
            SC.mission.controlsShow();
            // show enemies
            SC.mission.defaultEnemies();
            // simply reaching fisherman will end mission
            SC.mission.destination('ghosttown', 'fisherman', 2, function () {
                SC.mission.controlsHide();
                SC.bubbles('Fisherman',
                    ["You made it! I have a dagger for you",
                        "It's not fancy but better than nothing",
                        "With dagger you can kill those evil creatures",
                        "By the way, my niece Jane lives in town, she needs some food, can you bring her these fish",
                        "I show you on the map where Jane lives"
                        ],
                    SC.mission.end);
            });

        });
    });
};

SC.missions["2"] = function () {
    // Deliver fish to Jane
    SC.mission.begin('ghosttown', 'fisherman_room');
    SC.mission.objective('Deliver fish to Jane');
    SC.mission.setForward('ghosttown', 'jane', 0, 3);
    SC.mission.npc('Fisherman', 'ghosttown', 'fisherman', 'boy', 'down');
    SC.mission.npc('Jane', 'ghosttown', 'jane_bed', 'girl', 'down');
    // show map
    SC.mission.minimap(function () {
        // just for fun put fisherman to sleep
        SC.bubbles('Fisherman', ["Please go deliver the fish, I'm gonna take a short nap"], function (c) {
            c.turn('sleep');
            //c.ry -= 0.3;
            // show controls
            SC.mission.controlsShow();
            // show enemies
            SC.mission.defaultEnemies();
            // simply reaching jane will end mission
            SC.mission.destination('ghosttown', 'jane_bed', 2, function () {
                SC.mission.controlsHide();
                SC.bubbles('Jane',
                    ["Thank you for all the fish",
                        "It must been tough getting through all the monsters",
                        "If you'll ever get injured, you can heal yourself with medicinal herb",
                        "It grows on the quarry mountain. If you bring me some I can plant it in my garden.",
                        "Then you can take it from my garden any time you walk by",
                        "I'll show you on the map"],
                    SC.mission.end);
            });
        });
    });
};

SC.missions["3"] = function () {
    // Find herb
    SC.mission.begin('ghosttown', 'jane_room');
    SC.mission.objective('Find herb');
    SC.mission.setForward('ghosttown', 'herb', -3, 0);
    SC.mission.npc('Jane', 'ghosttown', 'jane_bed', 'girl', 'down');
    // clear garden
    var p = SC.places.byName["ghosttown garden_origin"];
    SC.map.changeArea('ghosttown', p.x, p.y, p.x + 3, p.y + 1, ['grass4']);
    // map
    SC.mission.minimap(function () {
        // good luck
        SC.bubbles('Jane', ['Good luck and be careful!'], function () {
            // show controls
            SC.mission.controlsShow();
            // show enemies
            SC.mission.defaultEnemies();
            // simply reaching herb will end mission
            SC.mission.destination('ghosttown', 'herb', 1, function () {
                // hide controls
                SC.mission.controlsHide();
                SC.bubbles('Player', ["Ok, these herbs are perfect", "Now back to Jane's garden"], SC.mission.end);
            });
        });
    });
};

SC.missions["4"] = function () {
    // Bring herb back
    SC.mission.begin('ghosttown', 'herb');
    SC.mission.objective('Bring herb back');
    SC.mission.setForward('ghosttown', 'garden', 2, 2);
    SC.mission.npc('Jane', 'ghosttown', 'garden', 'girl', 'down');
    // make sure garden is empty
    var p = SC.places.byName["ghosttown garden_origin"];
    SC.map.changeArea('ghosttown', p.x, p.y, p.x + 3, p.y + 1, ['grass4']);
    // map
    SC.mission.minimap(function () {
        // show controls
        SC.mission.controlsShow();
        // show enemies
        SC.mission.defaultEnemies();
        // simply reaching garden will end mission
        SC.mission.destination('ghosttown', 'garden', 2, function () {
            // hide controls
            SC.mission.controlsHide();
            // move player under garden for the dialog
            p = SC.mission.placeOrNpc('ghosttown', 'garden');
            SC.characters.player.goto(p.x, p.y + 1, 'up');
            SC.bubbles('Jane',
                ["Thank you for the herbs",
                    "I will plant them in my garden",
                    "Use the herbs when you are injured, they will heal you instantly"],
                function () {
                    SC.mission.walk('Jane', 'uUlLuU2prRu2prRu2prRu2prpdpDu2plLu2plLu2plLu2prRdD',
                        function () {
                            SC.bubbles('Jane',
                                ["Now go back to fisherman, he needs your help", "Here is the map"], SC.mission.end);
                        },
                        function (aCharacter) {
                            // plant herb
                            SC.map.change('ghosttown', aCharacter.x, aCharacter.y, ['grass1', 'herb-ground']);
                            SC.sound.play('herb');
                        });
                });
        });
    });
};

SC.missions["5"] = function () {
    // Visit fisherman
    SC.mission.begin('ghosttown', 'jane_garden_under');
    SC.mission.objective('Visit fisherman');
    SC.mission.setForward('ghosttown', 'fisherman', -3, 0);
    SC.mission.npc('Jane', 'ghosttown', 'garden', 'girl', 'down');
    SC.mission.npc('Fisherman', 'ghosttown', 'fisherman_bed', 'boy', 'down');
    // make sure herbs are planted since mission 5
    var rs = SC.places.byName["ghosttown river_source"];
    // make river dry
    SC.river(false);
    // river dam
    SC.map.change('ghosttown', rs.x, rs.y, ['mud', 'dam']);
    SC.mission.minimap(function () {
        // show controls
        SC.mission.controlsShow();
        // show enemies
        SC.mission.defaultEnemies();
        // simply reaching garden will end mission
        SC.mission.destination('ghosttown', 'fisherman', 2, function () {
            // hide controls
            SC.mission.controlsHide();
            // speech
            SC.bubbles('Fisherman',
                ["I need your help, the river dried up",
                    "Evil frogs build a dam and stopped the river",
                    "You must kill those frogs",
                    "Here is the map"], SC.mission.end);
        });
    });
};

SC.missions["6"] = function () {
    // Fix dry river
    SC.mission.begin('ghosttown', 'fisherman_room');
    SC.mission.objective('Fix dry river');
    SC.mission.setForward('ghosttown', 'river_source', -2, -2);
    SC.mission.npc('Fisherman', 'ghosttown', 'fisherman_bed', 'boy', 'down');
    // make sure it's dry
    SC.river(false, null, true);
    // explain mission
    SC.mission.minimap(function () {
        // show enemies
        SC.mission.defaultEnemies();
        SC.mission.enemies.push(SC.mission.npc('frog1', 'ghosttown', 'frog1', 'frog', 'down'));
        SC.mission.enemies.push(SC.mission.npc('frog2', 'ghosttown', 'frog2', 'frog', 'down'));
        SC.mission.enemies.push(SC.mission.npc('frog3', 'ghosttown', 'frog3', 'frog', 'down'));
        SC.mission.enemies.push(SC.mission.npc('frog4', 'ghosttown', 'frog4', 'frog', 'down'));
        SC.mission.enemies.push(SC.mission.npc('frog5', 'ghosttown', 'frog5', 'frog', 'down'));
        SC.mission.enemies.push(SC.mission.npc('frog6', 'ghosttown', 'frog6', 'frog', 'down'));
        SC.mission.enemies.push(SC.mission.npc('frog7', 'ghosttown', 'frog7', 'frog', 'down'));
        SC.mission.enemies.push(SC.mission.npc('frog8', 'ghosttown', 'frog8', 'frog', 'down'));
        SC.mission.enemies.push(SC.mission.npc('frog9', 'ghosttown', 'frog9', 'frog', 'down'));
        SC.mission.enemies.push(SC.mission.npc('frog10', 'ghosttown', 'frog10', 'frog', 'down'));
        // make those frogs attack as well
        var i;
        for (i = 0; i < SC.mission.enemies.length; i++) {
            SC.mission.enemies[i].onUpdate = SC.enemy.onUpdate;
        }
        // main frog will be stationary
        SC.mission.frog = SC.mission.npc('Frog', 'ghosttown', 'river_source', 'frog');
        SC.mission.enemies.push(SC.mission.frog);
        // show controls
        SC.mission.controlsShow();
        // check objective
        SC.mission.checkObjective = function () {
            // did player killed all frogs?
            if (SC.mission.enemiesAlive(SC.mission.enemies) <= 0) {
                // disable check
                SC.mission.checkObjective = undefined;
                // hide controls
                SC.mission.controlsHide();
                // remove dead
                SC.characters.removeDead();
                SC.mission.enemies = [];
                // show main frog dead
                SC.mission.frog = SC.mission.npc('Frog', 'ghosttown', 'river_source', 'frog');
                SC.mission.frog.turn('dead');
                SC.mission.frog.health = 0;
                // speech
                SC.bubbles('Frog',
                    ['You got me!',
                        'All I ever wanted was rule the world with the Ghost',
                        'He stole the magic book and summoned all monsters',
                        'Oops. I shouldn\'t have said that. Forget about it!',
                        'Aaargh...'
                        ],
                    function () {
                        // remove frog
                        SC.mission.frog.base('invisible');
                        // restore river and next mission
                        SC.river(true, SC.mission.end);
                    });
            }
        };
    });
};

SC.missions["7"] = function () {
    // Tell mayor about Ghost
    SC.mission.begin('ghosttown', 'river_source_player', 5);
    SC.mission.objective('Tell mayor about Ghost');
    SC.mission.setForward('ghosttown', 'throne', 0, 3);
    SC.mission.npc('Mayor', 'ghosttown', 'throne', 'girl', 'down');
    // explain mission
    SC.bubbles('Player',
        ["I must tell mayor it was Ghost who stole the magic book!"],
        function () {
            SC.mission.minimap(function () {
                // show controls
                SC.mission.controlsShow();
                // show enemies
                SC.mission.defaultEnemies();
                // reaching destination will end mission
                SC.mission.destination('ghosttown', 'throne', 2, function () {
                    // hide controls
                    SC.mission.controlsHide();
                    // speech
                    SC.bubbles('Player', [
                        'Frog told me who stole the magic book when I defeated it',
                        'It was Ghost! Should I kill him?'],
                        function () {
                            SC.bubbles('Mayor',
                                ['No! Dagger is not enough to kill Ghost.',
                                    'You need a special weapon, a magic wand!',
                                    'You need three crystals to make magic wand, go to the land office',
                                    'Surveyor from land office knows where the crystals are',
                                    'Here is the map'], SC.mission.end);
                        });
                });
            });
        });
};

SC.missions["8"] = function () {
    // Visit surveyor
    SC.mission.begin('ghosttown', 'under_throne_left');
    SC.mission.objective('Visit surveyor');
    SC.mission.setForward('ghosttown', 'surveyor', 0, 3);
    SC.mission.npc('Mayor', 'ghosttown', 'throne', 'girl', 'down');
    SC.mission.npc('Surveyor', 'ghosttown', 'surveyor', 'girl', 'down');
    // show map
    SC.mission.minimap(function () {
        // good luck
        SC.bubbles('Mayor', ['Good luck!'], function () {
            // show controls
            SC.mission.controlsShow();
            // show enemies
            SC.mission.defaultEnemies();
            // reaching destination will end mission
            SC.mission.destination('ghosttown', 'surveyor', 2, function () {
                // hide controls
                SC.mission.controlsHide();
                // chat
                SC.bubbles('Player', ['Hello, I need 3 crystals to make a magic wand'], function () {
                    SC.bubbles('Surveyor', ['Crystals only grow underground',
                        'One crystal is in the quarry, two crystals are in Ken\'s basement',
                        'Be very careful, there are many bats and spiders underground!',
                        'You can use dagger to free crystals from the ground',
                        'When you have 3 crystals give them to mayor, she will make the wand for you',
                        'Here is the map'], SC.mission.end);
                });
            });
        });
    });
};

SC.missions["9"] = function () {
    // Find 3 crystals
    SC.mission.begin('ghosttown', 'surveyor_desk');
    SC.mission.objective('Find 3 crystals');
    SC.mission.setForward('quarry', 'crystals1', -2, -2);
    SC.mission.npc('Surveyor', 'ghosttown', 'surveyor', 'girl', 'down');
    SC.mission.npc('Mayor', 'ghosttown', 'throne', 'girl', 'down');
    // turn player facing up
    SC.characters.player.turn('up');
    // place crystals in quarry and ken's basement
    SC.mission.crystals1 = SC.mission.npc('Crystals1', 'quarry', 'crystals1', 'crystals');
    SC.mission.crystals2 = SC.mission.npc('Crystals2', 'basement_ken', 'crystals2', 'crystals');
    SC.mission.crystals3 = SC.mission.npc('Crystals3', 'basement_ken', 'crystals3', 'crystals');
    SC.mission.remaining = 3;

    function onDie(aCharacter) {
        // event when crystal is destroyed
        console.log('onDie', aCharacter.name);
        SC.mission.remaining--;
        // say remaining
        if (SC.mission.remaining > 0) {
            SC.mission.controlsHide();
            SC.bubbles('Player', ['I need ' + SC.mission.remaining + ' more'], SC.mission.controlsShow);
            if (SC.mission.remaining === 2) {
                SC.mission.setForward('basement_ken', 'crystals2', 2, 0);
            }
        }
    }

    SC.mission.crystals1.onDie = onDie;
    SC.mission.crystals2.onDie = onDie;
    SC.mission.crystals3.onDie = onDie;
    // objective checker function
    SC.mission.checkObjective = function () {
        // all 3 collected?
        if (SC.mission.remaining === 0) {
            SC.mission.checkObjective = undefined;
            SC.mission.controlsHide();
            SC.bubbles('Player', ['Ok, back to mayor'], function () {
                SC.mission.controlsShow();
                SC.mission.objective('Back to mayor');
                SC.mission.setForward('ghosttown', 'throne', 0, 3);
                // must reach mayor
                SC.mission.destination('ghosttown', 'throne', 2, function () {
                    // speech
                    SC.mission.controlsHide();
                    SC.bubbles('Mayor', ["Thank you for the crystals", "I will make the magic wand now..."], function () {
                        // flash screen
                        SC.mission.lightning(function () {
                            // make the magic wand
                            SC.sound.play('magic');
                            SC.effects.magic(SC.characters.names.Mayor, function () {
                                // speech
                                SC.bubbles('Mayor',
                                    ['Success! Here is your magic wand!',
                                        'It is only effective against Ghost',
                                        'Ghost lives in the cave on the cemetery',
                                        'Cemetery is full of skeletons, be very careful',
                                        'Here is the map'],
                                    function () {
                                        SC.mission.end();
                                    });
                            });
                        });
                    });
                });
            });
        }
    };
    // show map
    SC.mission.minimap(function () {
        // show controls
        SC.mission.controlsShow();
        // show enemies
        SC.mission.defaultEnemies();
    });
};

SC.missions["10"] = function () {
    // Go to cemetery
    SC.mission.begin('ghosttown', 'under_throne_left');
    SC.mission.objective('Go to cemetery');
    SC.mission.setForward('ghosttown', 'tomb', 0, 3);
    SC.mission.npc('Mayor', 'ghosttown', 'throne', 'girl', 'down');
    SC.mission.npc('Ghost', 'tomb', 'ghost', 'ghost', 'down');
    // show map
    SC.mission.minimap(function () {
        // good luck
        SC.bubbles('Mayor', ['Good luck!'], function () {
            // show controls
            SC.mission.controlsShow();
            // show enemies
            SC.mission.defaultEnemies();
            // reaching destination will end mission
            SC.mission.destination('tomb', 'doors', 2, SC.mission.end);
        });
    });
};

SC.missions["11"] = function () {
    // Kill Ghost
    SC.mission.begin('tomb', 'doors');
    SC.mission.objective('Kill Ghost');
    SC.mission.setForward('tomb', 'doors', 0, 0);
    SC.mission.npc('Mayor', 'ghosttown', 'throne', 'girl', 'down');
    var g = SC.mission.npc('Ghost', 'tomb', 'ghost', 'ghost', 'down');
    SC.characters.player.turn('up');
    // speech
    SC.bubbles('Player', ['I came here to kill you evil Ghost!'], function () {
        SC.bubbles('Ghost', ['Ha ha ha, you cannot kill me with a dagger!'], function () {
            SC.bubbles('Player', ['I have something better!'], function () {
                document.getElementById('attackbutton').style.backgroundImage = 'url(image/magicwand32.png)';
                SC.bubbles('Player', ['Magic wand!'], function () {
                    SC.bubbles('Ghost', ['Oh oh!'], function () {
                        // show controls
                        SC.mission.controlsShow();
                        // ghost start attacking
                        g.onUpdate = SC.enemy.onUpdate;
                        // check objective
                        SC.mission.checkObjective = function () {
                            // was ghost killed?
                            if (SC.characters.names.Ghost.health <= 0) {
                                SC.mission.checkObjective = undefined;
                                SC.mission.controlsHide();
                                // speech
                                SC.bubbles('Ghost', ['You got me!', 'Now I can finally rest in peace'], function () {
                                    // turn ghost to skeleton
                                    SC.characters.names.Ghost.base('skeleton');
                                    SC.characters.names.Ghost.health = 100;
                                    SC.characters.names.Ghost.turn('down');
                                    // move to tomb stone
                                    var p = SC.mission.placeOrNpc('tomb', 'stone');
                                    SC.characters.names.Ghost.goto(p.x, p.y, 'down');
                                    // turn to sleeping boy on arrival
                                    SC.characters.names.Ghost.onStop = function () {
                                        SC.characters.names.Ghost.base('boy');
                                        SC.characters.names.Ghost.turn('sleep');
                                        // final words
                                        SC.bubbles('Ghost', ['My last wish is...', 'Please deliver magic book back to Mayor', 'And make sure nobody else can get to it'], SC.mission.end);
                                    };
                                });
                            }
                        };
                    });
                });
            });
        });
    });
};

SC.missions["12"] = function () {
    // Deliver book back to mayor
    SC.mission.begin('tomb', 'middle');
    SC.mission.objective('Return book to Mayor');
    SC.mission.setForward('ghosttown', 'throne', 0, 3);
    SC.mission.npc('Mayor', 'ghosttown', 'throne', 'girl', 'down');
    SC.mission.npc('Ghost', 'tomb', 'stone', 'boy', 'sleep');
    // make sure table is empty
    var p = SC.mission.placeOrNpc('library', 'table');
    SC.map.change('library', p.x, p.y, ['floor4', 'table']);
    // make sure chest is closed
    p = SC.mission.placeOrNpc('library', 'chest');
    SC.map.change('library', p.x, p.y, ['floor4', 'chest1']);
    // explain mission
    SC.bubbles('Player',
        ['This book is too dangerous',
            'I must return it to Mayor'], function () {
            // show map
            SC.mission.minimap(function () {
                // show controls
                SC.mission.controlsShow();
                // no enemies on last mission
                // reaching throne
                SC.mission.destination('ghosttown', 'throne', 2, function () {
                    SC.mission.controlsHide();
                    SC.mission.objective('');
                    // mayor speech
                    SC.bubbles('Mayor',
                        ['You are my hero! You saved our town once again', 'Follow me'],
                        function () {
                            SC.mission.controlsShow();
                            SC.characters.names.Mayor.walkPath('lLLpppppppprRRuUpppppppUUrRuUUlLd', function () {
                                console.log('Mayor sitting in library');
                            });
                        });
                    // reaching library
                    SC.mission.destination('library', 'table', 2, function () {
                        SC.mission.controlsHide();
                        SC.bubbles('Mayor', ['The book shall remain here', 'I will lock the door, nobody will enter this library'],
                            function () {
                                // put book on the table
                                var t = SC.mission.placeOrNpc('library', 'table');
                                SC.map.change('library', t.x, t.y, ['floor4', 'table', 'booksmall']);
                                // make sure mayor is on chair because her next walk is relative
                                SC.characters.names.Mayor.teleport('library', t.x, t.y - 1, 'down');
                                // move to chest
                                SC.mission.walk('Mayor', 'lLL', function () {
                                    // open chest
                                    SC.mission.chestOpen('library', 'chest', function () {
                                        // move down
                                        SC.mission.walk('Mayor', 'pppprRdDD', function () {
                                            // speak
                                            SC.bubbles('Mayor', ['I have something for you, follow me!'], function () {
                                                // move to hall
                                                SC.mission.controlsShow();
                                                SC.mission.walk('Mayor', 'DrRdDppppdDlLLpppprRRd', function () {
                                                    console.log('m in hall');
                                                });
                                            });
                                            // reaching hall again
                                            SC.mission.destination('ghosttown', 'throne', 2, function () {
                                                SC.mission.controlsHide();
                                                // walk player in front of throne
                                                var u = SC.mission.placeOrNpc('ghosttown', 'throne');
                                                SC.characters.player.goto(u.x, u.y + 2, 'up');
                                                // final speech
                                                SC.bubbles('Mayor', ['For the bravery and courage you showed us', 'and for saving our town once again', 'I am giving you Sword of Ghost town founder'], function () {
                                                    SC.mission.controlsShow();
                                                    SC.galleryItem('Ghost sword', 'image/mission/sword300.png', function () {
                                                        SC.bubbles('Mayor', ['You will need it in Ghost town 3: destruction of magic book', 'You can click on menu on the top if you want to replay the game', 'Thank you for playing this game. Bye bye.'], function () {
                                                            SC.mission.objective('');
                                                            SC.mission.end();
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                    });
                });
            });
        });
};

SC.missions["13"] = function () {
    // ending
    SC.mission.begin('ghosttown', 'under_throne_left');
    SC.mission.objective('Game over', 'Menu');
    SC.mission.setForward('ghosttown', 'throne', 0, 3);
    SC.mission.npc('Mayor', 'ghosttown', 'throne', 'girl', 'down');
    SC.mission.npc('Fisherman', 'ghosttown', 'fisherman', 'boy', 'down');
    SC.mission.npc('Surveyor', 'ghosttown', 'surveyor', 'girl', 'down');
    SC.mission.npc('Jane', 'ghosttown', 'jane_bed', 'girl', 'down');
    SC.mission.controlsShow();
    SC.onMenu();
};

SC.missions["14"] = function () {
    // stopper
    console.warn('14 - no more missions');
};

SC.missions["20"] = function () {
    // testing mission
    SC.mission.begin('quarry', 'crystals1');
    SC.mission.objective('Testing mission');
    SC.mission.setForward('ghosttown', 'tomb', 0, 3);
    SC.mission.defaultEnemies();
    SC.mission.controlsShow();
    //SC.mission.npc('Mayor', 'ghosttown', 'throne', 'girl', 'down');
    //SC.mission.npc('Ghost', 'tomb', 'stone', 'boy', 'sleep');
};


