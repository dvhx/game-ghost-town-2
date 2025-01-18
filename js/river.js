// Turn river dry or wet
"use strict";
// globals: document, window

var SC = window.SC || {};

SC.river = function (aWet, aCallback, aVeryFast) {
    // Turn river dry or wet
    var p = SC.places.byName["ghosttown river_source"],
        c = SC.character('Editor', 'ghosttown', p.x, p.y, 'waterfront'),
        step = 0;
    SC.mission.editor = c;
    if (aWet) {
        SC.map.change('ghosttown', p.x, p.y, ['water', 'water1']);
    } else {
        SC.map.change('ghosttown', p.x, p.y, ['drydown', 'dam']);
    }
    c.speed = aVeryFast ? 0 : 20;
    c.walkPath('wD2D2lL2L2L2dD2D2D2D2D2D2lL2L2dD2D2D2D2D2D2D2D2D2D2D2D2D2D2', function () {
        if (aCallback) {
            aCallback(aWet);
        }
        c.base('invisible');
    }, function (ch) {
        step++;
        if (step === 10) {
            ch.speed = 0;
        }
        if (!aWet) {
            switch (step) {
            case 2:
            case 11:
                return SC.map.change('ghosttown', ch.x, ch.y, ['dry3']);
            case 3:
            case 4:
            case 12:
                return SC.map.change('ghosttown', ch.x, ch.y, ['mud']);
            case 5:
            case 13:
                return SC.map.change('ghosttown', ch.x, ch.y, ['dry7']);
            case 9:
            case 15:
            case 23:
                return SC.map.change('ghosttown', ch.x, ch.y, ['drydown', 'rocks']);
            case 25:
            case 26:
            case 27:
                return SC.map.change('ghosttown', ch.x, ch.y, ['water', 'water1']);
            default:
                return SC.map.change('ghosttown', ch.x, ch.y, ['drydown']);

            }
        }
        if (step === 1 || step === 8) {
            SC.map.change('ghosttown', ch.x, ch.y, ['waterfall']);
        } else if (step === 9 || step === 15 || step === 23) {
            SC.map.change('ghosttown', ch.x, ch.y, ['water', 'water1', 'rocks']);
        } else {
            SC.map.change('ghosttown', ch.x, ch.y, ['water', 'water1']);
        }
    });
};

