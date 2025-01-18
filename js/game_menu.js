// Ending menu with options (return to game, missions)
"use strict";
// globals: document, window, setTimeout

var SC = window.SC || {};

SC.game_menu = function () {
    // Show ending menu
    SC.pause = true;
    if (SC.menuVisible) {
        console.log('Menu already visible');
        return;
    }
    SC.menuVisible = true;

    // background
    var bg, h1, h2, div, fb;
    bg = document.createElement('div');
    bg.className = 'menu';

    // title
    h1 = document.createElement('h1');
    h1.textContent = 'Ghost town 2';
    bg.appendChild(h1);
    h2 = document.createElement('h2');
    h2.textContent = 'Monster survival';
    bg.appendChild(h2);

    // div
    div = document.createElement('div');
    div.className = 'main';
    bg.appendChild(div);

    function one(aCaption, aCallback, aCallbackData, aSubtitle) {
        // One button
        var item = document.createElement('button'), sub;
        item.textContent = aCaption;
        item.className = 'item';
        item.addEventListener('click', aCallback);
        item.data = aCallbackData;
        if (aSubtitle) {
            sub = document.createElement('div');
            sub.className = 'subtitle';
            sub.textContent = aSubtitle;
            sub.data = aCallbackData;
            item.appendChild(sub);
        }
        if (!aCallback) {
            item.disabled = true;
        }
        div.appendChild(item);
        return item;
    }

    function hide() {
        // hide menu
        SC.menuVisible = false;
        bg.parentElement.removeChild(bg);
        SC.pause = false;
    }

    one('Return to game', hide);

    function onMission(event) {
        // Reset mission
        console.warn('Will start mission', event.target.data);
        hide();
        SC.mission.reset(event.target.data);
    }

    function missionLabel(aMajor, aTitle) {
        // One mission button
        if (aMajor <= 1 || SC.storage.readBoolean('SC.mission.unlock.' + (aMajor - 1), false)) {
            one('Replay mission ' + aMajor, onMission, aMajor, aTitle);
        } else {
            one('Mission ' + aMajor, null, aMajor, 'Locked');
        }
    }

    missionLabel(0, 'Introduction');
    missionLabel(1, 'Getting dagger');
    missionLabel(2, 'Deliver fish to Jane');
    missionLabel(3, 'Find herb');
    missionLabel(4, 'Bring herb back');
    missionLabel(5, 'Visit fisherman');
    missionLabel(6, 'Fix dry river');
    missionLabel(7, 'Tell mayor about Ghost');
    missionLabel(8, 'Visit surveyor');
    missionLabel(9, 'Find 3 crystals');
    missionLabel(10, 'Go to cemetery');
    missionLabel(11, 'Kill Ghost');
    missionLabel(12, 'Return book to Mayor');

    // show menu
    document.body.appendChild(bg);
};

