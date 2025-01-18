// Speech bubbles
"use strict";
// globals: document, window, setTimeout

var SC = window.SC || {};

SC.bubble = function (aContext, aText, aX, aY, aColor, aPreviousBubble) {
    // Draw speech bubble

    function invervalOverlap(a, b, c, d) {
        // return true if inverval <a, b> overlap <c, d>
        return (c <= b) && (d >= a);
    }

    function boundingBoxOverlap(a, b) {
        // return true if 2 bounding boxes {l,t,w,h} overlaps
        return (invervalOverlap(a.l, a.l + a.w, b.l, b.l + b.w) && invervalOverlap(a.t, a.t + a.h, b.t, b.t + b.h));
    }

    var x = aX + 0.5, y = aY + 0.5, d = 10, l, t, w, h, rowh, padding = 2, ff,
        edge = 14, i, words, lines, wordwidth, linewidth, bounding_box, dy,
        toolbarWidth = 0,
        canvasWidth = SC.canvas.char.width,
        canvasHeight = SC.canvas.char.height;

    // offset text on firefox
    ff = 1;
    if (window.navigator && window.navigator.userAgent && window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        ff = 2;
    }

    aContext.font = '16px sans-serif';
    w = aContext.measureText(aText).width;
    h = SC.canvas.fontHeight(16, 'sans-serif') + 2;
    rowh = h;

    // measure width of individual words, split long sentence to multiple lines to fit canvas
    words = aText.split(' ');
    lines = [];
    linewidth = 0;
    for (i = 0; i < words.length; i++) {
        wordwidth = aContext.measureText(words[i] + ' ').width;
        // wrap the line if word don't fit canvas
        if (linewidth + wordwidth + 2 * padding + 2 * edge > canvasWidth - toolbarWidth) {
            lines.push('\n');
            linewidth = 0;
        }
        // append word to the line
        linewidth += wordwidth;
        lines.push(words[i]);
    }
    lines = lines.join(' ').split('\n');
    lines = lines.map(function (a) { return a.trim(); });
    //console.log(JSON.stringify(lines, undefined, 2));

    // measure height
    h = lines.length * rowh;

    // measure longest line
    w = 0;
    for (i = 0; i < lines.length; i++) {
        w = Math.max(aContext.measureText(lines[i]).width, w);
    }
    w = Math.round(w + 2 * padding);
    //console.log('line w max', w, 'canvas.width', canvasWidth, 'h', h, 'lines', lines.length);

    // make sure it fits the canvas
    l = x - Math.round(w / 2);
    t = y - d - h;
    if (l < edge) {
        l = edge;
    }
    if (t < edge) {
        t = edge;
    }
    if (l + w + edge > canvasWidth - toolbarWidth) {
        l = canvasWidth - w - edge - toolbarWidth;
    }
    if (t + h + edge > canvasHeight) {
        t = canvasHeight - h - edge;
    }
    if (x < edge) {
        x = edge;
    }
    if (x > canvasWidth - 2 * d - toolbarWidth) {
        x = canvasWidth - 2 * d - toolbarWidth;
    }
    if (y < edge + h + d) {
        y = edge + h + d;
    }
    if (y > canvasHeight) {
        y = canvasHeight;
    }
    //console.log({ x: x, y: y, l: l, t: t, w: w, h: h, lines: lines });

    // resolve overlap with previous bubble
    // currently only 2 bubbles are supported
    bounding_box = { l: l, t: t, w: w, h: h};
    if (aPreviousBubble) {
        if (boundingBoxOverlap(aPreviousBubble, bounding_box)) {
            // move current up
            dy = t - (aPreviousBubble.t - h) + padding;
            t = t - dy;
            //y = y - dy;
        }
    }

    // bubble
    aContext.fillStyle = aColor || 'white';
    aContext.strokeStyle = 'black';
    aContext.lineWidth = 3;
    aContext.beginPath();
    //console.log('x', x, 'y', y, 't', t, 'w', w, 'h', h, 'l', l, 'd', d);
    aContext.moveTo(x, y);
    aContext.lineTo(x, t + h);
    aContext.lineTo(l, t + h);
    aContext.lineTo(l, t);
    aContext.lineTo(l + w, t);
    aContext.lineTo(l + w, t + h);
    aContext.lineTo(Math.min(l + w, x + d), t + h);
    aContext.closePath();
    aContext.stroke();
    aContext.fill();

    // text
    aContext.fillStyle = 'black';
    aContext.textBaseline = 'top';
    for (i = 0; i < lines.length; i++) {
        aContext.fillText(lines[i], l, t + i * rowh + ff);
    }

    // return bounding box for bubbles collision detection
    return bounding_box;
};

SC.bubbles = function (aNick, aSentences, aCallback) {
    // Display multiple bubbles over NPC character when he explain mission with "next" button
    console.warn('SC.bubbles', aNick, aSentences);
    var ch = SC.characters.names[aNick],
        all = aSentences.slice(),
        button,
        onKeyDown,
        opaque = true;

    function next() {
        // show next sentence
        var s = all.shift();
        if (s) {
            ch.bubble = s;
            SC.characters.key = '';
        } else {
            ch.bubble = '';
            SC.characters.key = '';
            button.parentElement.removeChild(button);
            window.removeEventListener('keydown', onKeyDown, true);
            //console.warn('Finished bubbles', aNick, aSentences);
            if (aCallback) {
                aCallback(ch, aSentences);
            }
        }
    }
    next();

    button = document.createElement('button');
    button.className = 'gt_bubbles_next';
    button.style.position = 'fixed';
    //button.style.right = '1cm';
    //button.style.bottom = '1cm';
    //button.style.minWidth = '1.3cm';
    //button.style.minHeight = '1.3cm';
    //button.style.fontWeight = 'bold';
    button.style.opacity = 0;
    button.style.transition = 'opacity 0.2s linear';
    button.innerText = 'Next';
    button.addEventListener('click', next);
    document.body.appendChild(button);

    button.data = {nick: aNick, sentences: aSentences, callback: aCallback };

    onKeyDown = function (event) {
        // enter show next bubble
        if (event.keyCode === 13) {
            next();
            event.preventDefault();
        }
    };
    window.addEventListener('keydown', onKeyDown, true);

    function blink() {
        if (all.length >= 0) {
            button.style.opacity = opaque ? 1 : 0.3;
            setTimeout(blink, opaque ? 1000 : 200);
            opaque = !opaque;
        } else {
            button.style.opacity = 1;
        }
    }
    setTimeout(blink, 300);
};

SC.bubblesCasual = function (aNick, aSentences, aCallback) {
    // Show independent (non-interractive) speech bubbles over character
    var ch = SC.characters.names[aNick],
        all = aSentences.slice();
    function next() {
        // show next sentence
        var s = all.shift();
        if (s) {
            ch.bubble = s;
            SC.characters.key = '';
            setTimeout(next, s.length * 150 + 1500);
        } else {
            ch.bubble = '';
            SC.characters.key = '';
            console.warn('Finished bubblesCasual', aNick, aSentences);
            if (aCallback) {
                aCallback(ch, aSentences);
            }
        }
    }
    next();
};

