// Visual Search Plugin for jsPsych 7

var jsPsychVisualSearch = (function (jspsych) {
    'use strict';

    // ── Arrangement cache (shared across all trials in a session) ─────
    let _arrangements      = null;
    let _arrangementW      = null;
    let _arrangementH      = null;
    let _lastArrangementIdx = -1;

    // Precompute n non-overlapping arrangements.
    // Each arrangement = 18 slots: [0]=cue, [1]=adj-to-cue, [2-3]=coloured, [4-17]=gray
    // Slot 1 is always to the RIGHT of slot 0 — mirrored at render time for left-side participants.
    function precomputeArrangements(n, W, H, imgW, imgH, cImgW, cImgH, bdW, bdH) {
        const gap = 30;  // minimum pixel gap between any two image edges
        const pad = 20;  // canvas edge padding
        const result = [];

        // Zone by PAIR centre (cue + adjacent slot together), not cue centre alone.
        // Pair width = bdW + gap + imgW. The pair centre is always (gap+imgW)/2 away
        // from the cue centre (in the direction of adjSide). By zoning the pair centre
        // we get even screen coverage regardless of which side the adjacent slot is on,
        // and mirroring for target_side preserves the even distribution.
        const halfAdj = (gap + imgW) / 2;         // cue-centre to pair-centre offset
        const pairW   = bdW + gap + imgW;          // full pair width
        const pcXMin  = pad + pairW / 2;           // min valid pair-centre x
        const pcXMax  = W - pad - pairW / 2;       // max valid pair-centre x
        const pcYMin  = pad + bdH / 2;             // cue must fit vertically
        const pcYMax  = H - pad - bdH / 2;

        const nCols = 5, nRows = Math.ceil(n / nCols);
        const xStep = (pcXMax - pcXMin) / (nCols - 1);
        const yStep = (pcYMax - pcYMin) / (nRows - 1);
        // Jitter radius: 15% of step so positions are distinct but not rigidly fixed
        const xJitter = xStep * 0.15;
        const yJitter = yStep * 0.15;

        for (let i = 0; i < n; i++) {
            const col = i % nCols;
            const row = Math.floor(i / nCols);
            // Target pair centre at grid node, with small random jitter
            const targetX = pcXMin + col * xStep;
            const targetY = pcYMin + row * yStep;
            const zXMin = targetX - xJitter;
            const zXMax = targetX + xJitter;
            const zYMin = targetY - yJitter;
            const zYMax = targetY + yJitter;
            let arr = null;
            while (!arr) arr = tryOne(zXMin, zXMax, zYMin, zYMax);
            result.push(arr);
        }
        return result;

        function overlaps(placed, x, y, w, h) {
            for (const p of placed) {
                if (Math.abs(x - p.x) < (w + p.w) / 2 + gap &&
                    Math.abs(y - p.y) < (h + p.h) / 2 + gap) return true;
            }
            return false;
        }

        function placeRandom(placed, w, h) {
            for (let a = 0; a < 10000; a++) {
                const x = pad + w / 2 + Math.random() * (W - 2 * pad - w);
                const y = pad + h / 2 + Math.random() * (H - 2 * pad - h);
                if (!overlaps(placed, x, y, w, h)) return { x, y, w, h };
            }
            return null;
        }

        function tryOne(zXMin, zXMax, zYMin, zYMax) {
            const placed = [];
            const adjSide = Math.random() < 0.5 ? 'right' : 'left';

            // Sample pair centre within zone, then derive cue position.
            // pair_centre_x = cue.x + halfAdj (adjSide='right')
            //               = cue.x - halfAdj (adjSide='left')
            let cuePos = null;
            for (let a = 0; a < 10000; a++) {
                const pcX = zXMin + Math.random() * (zXMax - zXMin);
                const pcY = zYMin + Math.random() * (zYMax - zYMin);
                const x   = adjSide === 'right' ? pcX - halfAdj : pcX + halfAdj;
                const y   = pcY;
                if (x - bdW / 2 < pad || x + bdW / 2 > W - pad) continue;
                if (y - bdH / 2 < pad || y + bdH / 2 > H - pad) continue;
                const tx = adjSide === 'right'
                    ? x + bdW / 2 + imgW / 2 + gap
                    : x - bdW / 2 - imgW / 2 - gap;
                if (adjSide === 'right' && tx + imgW / 2 > W - pad) continue;
                if (adjSide === 'left'  && tx - imgW / 2 < pad)     continue;
                if (y - imgH / 2 < pad || y + imgH / 2 > H - pad)   continue;
                cuePos = { x, y, w: bdW, h: bdH };
                break;
            }
            if (!cuePos) return null;
            placed.push(cuePos);

            // Slot 1: immediately adjacent to cue on adjSide
            const adjX   = adjSide === 'right'
                ? cuePos.x + bdW / 2 + imgW / 2 + gap
                : cuePos.x - bdW / 2 - imgW / 2 - gap;
            const adjPos = { x: adjX, y: cuePos.y, w: imgW, h: imgH };
            if (overlaps(placed, adjPos.x, adjPos.y, adjPos.w, adjPos.h)) return null;
            placed.push(adjPos);

            // Slots 2–3: coloured distractors
            for (let i = 0; i < 2; i++) {
                const pos = placeRandom(placed, cImgW, cImgH);
                if (!pos) return null;
                placed.push(pos);
            }

            // Slots 4–17: gray positions (14 slots)
            for (let i = 0; i < 14; i++) {
                const pos = placeRandom(placed, imgW, imgH);
                if (!pos) return null;
                placed.push(pos);
            }

            return { slots: placed, adjSide }; // 18 positions + adjacency direction
        }
    }

    // ── Plugin info ───────────────────────────────────────────────────
    const info = {
        name: 'visual-search',
        description: 'Visual search task with spatial regularity manipulation.',
        parameters: {
            images: {
                type: jspsych.ParameterType.OBJECT,
                default: [],
                description: 'Array of image src strings for this trial.'
            },
            background_colour: {
                type: jspsych.ParameterType.STRING,
                default: 'white'
            },
            image_size: {
                type: jspsych.ParameterType.INT,
                default: [160, 160],
                description: 'Display size [w, h] of gray images.'
            },
            coloured_image_size: {
                type: jspsych.ParameterType.INT,
                default: [160, 160],
                description: 'Display size [w, h] of coloured distractors.'
            },
            biggest_distractor_size: {
                type: jspsych.ParameterType.INT,
                default: [300, 300],
                description: 'Display size [w, h] of the cue distractor.'
            },
            cue_name: {
                type: jspsych.ParameterType.STRING,
                default: null,
                description: 'Basename (no extension) of the cue distractor.'
            },
            regularity: {
                type: jspsych.ParameterType.BOOL,
                default: false,
                description: 'If true, target appears in slot adjacent to cue.'
            },
            target_side: {
                type: jspsych.ParameterType.STRING,
                default: 'right',
                description: '"left" or "right": which side of cue the target appears on.'
            },
            fixation_duration: {
                type: jspsych.ParameterType.INT,
                default: 500
            },
            feedback_duration: {
                type: jspsych.ParameterType.INT,
                default: 1500
            },
            iti_duration: {
                type: jspsych.ParameterType.INT,
                default: 500
            },
            reminder_duration: {
                type: jspsych.ParameterType.INT,
                default: 1500,
                description: 'How long the target reminder is shown after an incorrect response.'
            },
            trial_num: {
                type: jspsych.ParameterType.INT,
                default: null,
                description: 'Current trial number within the block (displayed in top-right corner).'
            },
            n_trials: {
                type: jspsych.ParameterType.INT,
                default: null,
                description: 'Total number of trials in the block.'
            },
            show_rt: {
                type: jspsych.ParameterType.BOOL,
                default: false,
                description: 'If true, show the search RT during the verification phase (practice only).'
            }
        }
    };

    // ── Plugin class ──────────────────────────────────────────────────
    class VisualSearchPlugin {

        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {

            const pr    = window.devicePixelRatio || 1;
            const W     = 1920;
            const H     = 1080;
            const cx    = W / 2;
            const cy    = H / 2;
            const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
            const imgW = trial.image_size[0];
            const imgH = trial.image_size[1];
            const cImgW = trial.coloured_image_size[0];
            const cImgH = trial.coloured_image_size[1];
            const bdW  = trial.biggest_distractor_size[0];
            const bdH  = trial.biggest_distractor_size[1];

            const self = this;

            // ── Canvas ────────────────────────────────────────────────
            const cssW = W * scale;
            const cssH = H * scale;
            const marginTop = (window.innerHeight - cssH) / 2;

            display_element.innerHTML =
                `<style>
                  #vs-canvas { display:block; margin:${marginTop}px auto 0; }
                  .jspsych-content-wrapper { width:100% !important; }
                  .jspsych-content { max-width:100% !important; padding:0 !important; }
                </style>
                <canvas id="vs-canvas"></canvas>`;

            const canvas = document.getElementById('vs-canvas');
            const ctx    = canvas.getContext('2d');
            canvas.width        = W * pr;
            canvas.height       = H * pr;
            canvas.style.width  = cssW + 'px';
            canvas.style.height = cssH + 'px';
            ctx.scale(pr, pr);

            // ── State ─────────────────────────────────────────────────
            let imagePositions      = [];
            let targetItem          = null;
            let verificationLetters = [];
            let targetLetter        = null;
            let phase               = 'fixation';
            let searchStartTime     = null;
            let verifyStartTime     = null;

            const response = {
                search_rt:            null,
                verification_key:     null,
                verification_correct: null,
                verification_rt:      null
            };

            // ── Helpers ───────────────────────────────────────────────
            function baseName(src) {
                return src.split('/').pop().replace(/\.[^/.]+$/, '');
            }

            function clearCanvas() {
                ctx.fillStyle = trial.background_colour;
                ctx.fillRect(0, 0, W, H);
            }

            function drawTrialCounter() {
                if (trial.trial_num === null || trial.n_trials === null) return;
                ctx.font         = '16px Arial';
                ctx.fillStyle    = '#999';
                ctx.textAlign    = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText(trial.trial_num + ' / ' + trial.n_trials, W - 12, 10);
            }

            function drawCross() {
                const arm = 15;
                ctx.strokeStyle = 'black';
                ctx.lineWidth   = 2.5;
                ctx.beginPath();
                ctx.moveTo(cx - arm, cy); ctx.lineTo(cx + arm, cy);
                ctx.moveTo(cx, cy - arm); ctx.lineTo(cx, cy + arm);
                ctx.stroke();
            }

            function drawFixation() {
                clearCanvas();
                drawCross();
                drawTrialCounter();
            }

            // ── Draw phases ───────────────────────────────────────────
            // showGray=false: draw only coloured_ images (first onset)
            // showGray=true:  draw all images (200 ms later)
            function drawSearchDisplay(showGray) {
                clearCanvas();
                for (const item of imagePositions) {
                    const isColoured = baseName(item.src).startsWith('coloured_');
                    if (!isColoured && !showGray) continue;
                    ctx.drawImage(item.img, item.x - item.w / 2, item.y - item.h / 2, item.w, item.h);
                }
                drawTrialCounter();
            }

            function drawVerificationDisplay() {
                clearCanvas();
                const letters = self.jsPsych.randomization.shuffle(
                    Array.from({ length: imagePositions.length }, (_, i) => String.fromCharCode(65 + i))
                );
                verificationLetters = imagePositions.map((item, i) => ({
                    letter: letters[i],
                    x: item.x,
                    y: item.y,
                    name: baseName(item.src)
                }));
                targetLetter = verificationLetters.find(l => l.name.startsWith('target_')).letter;

                ctx.font         = 'bold 30px Arial';
                ctx.textAlign    = 'center';
                ctx.textBaseline = 'middle';
                for (const item of verificationLetters) {
                    ctx.fillStyle = 'black';
                    ctx.fillText(item.letter, item.x, item.y);
                }
                ctx.font      = '20px Arial';
                ctx.fillStyle = '#333';
                if (trial.show_rt && response.search_rt !== null) {
                    ctx.fillText('Your response time: ' + Math.round(response.search_rt) + ' ms  |  Press the letter at the target\'s position', cx, H - 25);
                } else {
                    ctx.fillText("Press the letter at the target's position", cx, H - 25);
                }
                drawTrialCounter();
            }

            function drawVerificationFeedback(pressedKey) {
                clearCanvas();
                const correct = pressedKey === targetLetter;
                ctx.textAlign    = 'center';
                ctx.textBaseline = 'middle';
                for (const item of verificationLetters) {
                    if (item.letter === targetLetter) {
                        ctx.fillStyle = 'green';
                        ctx.font = 'bold 36px Arial';
                    } else if (item.letter === pressedKey && !correct) {
                        ctx.fillStyle = 'red';
                        ctx.font = 'bold 36px Arial';
                    } else {
                        ctx.fillStyle = '#ccc';
                        ctx.font = 'bold 30px Arial';
                    }
                    ctx.fillText(item.letter, item.x, item.y);
                }
                const msg = correct ? 'Correct!' : `Incorrect – the target was at ${targetLetter}`;
                ctx.font      = 'bold 32px Arial';
                ctx.fillStyle = correct ? 'green' : 'red';
                ctx.fillText(msg, cx, cy);
            }

            // ── Image loading ─────────────────────────────────────────
            function loadImages(srcs, callback) {
                if (srcs.length === 0) { callback([]); return; }
                let loaded = 0;
                const result = [];
                for (const src of srcs) {
                    const img = new Image();
                    img.onload = img.onerror = () => {
                        loaded++;
                        if (loaded === srcs.length) callback(result);
                    };
                    img.src = src;
                    result.push({ img, src });
                }
            }

            // ── Phase logic ───────────────────────────────────────────
            function startFixation() {
                phase = 'fixation';
                drawFixation();
                self.jsPsych.pluginAPI.setTimeout(startSearch, trial.fixation_duration);
            }

            function startSearch() {
                phase = 'search';

                // Precompute arrangements once per session (or if screen size changed)
                if (!_arrangements || _arrangementW !== W || _arrangementH !== H) {
                    _arrangements = precomputeArrangements(20, W, H, imgW, imgH, cImgW, cImgH, bdW, bdH);
                    _arrangementW = W;
                    _arrangementH = H;
                }

                loadImages(trial.images, (loadedImgs) => {

                    // Pick a random arrangement, excluding the one used last trial
                    const available = _arrangements
                        .map((arr, idx) => ({ arr, idx }))
                        .filter(({ idx }) => idx !== _lastArrangementIdx);
                    const picked = self.jsPsych.randomization.sampleWithoutReplacement(available, 1)[0];
                    _lastArrangementIdx = picked.idx;

                    // Mirror if the arrangement's adjacency direction doesn't match target_side,
                    // so the adjacent slot (target in regular blocks) always ends up on target_side.
                    const needsMirror = picked.arr.adjSide !== trial.target_side;
                    const arr = needsMirror
                        ? picked.arr.slots.map(p => ({ ...p, x: W - p.x }))
                        : picked.arr.slots;

                    // Categorise loaded images
                    const cueImg = trial.cue_name
                        ? loadedImgs.find(i => baseName(i.src) === trial.cue_name)
                        : null;
                    const targetImg = loadedImgs.find(i => baseName(i.src).startsWith('target_'));
                    const colouredImgs = self.jsPsych.randomization.shuffle(
                        loadedImgs.filter(i => i !== cueImg && baseName(i.src).startsWith('coloured_'))
                    );
                    const grayImgs = self.jsPsych.randomization.shuffle(
                        loadedImgs.filter(i =>
                            i !== cueImg &&
                            i !== targetImg &&
                            !baseName(i.src).startsWith('coloured_')
                        )
                    );

                    // Build imagePositions by assigning images to arrangement slots
                    // Slots: [0]=cue, [1]=adjacent(target in regular), [2-3]=coloured, [4-17]=gray
                    const assignment = new Array(18);

                    assignment[0] = { ...arr[0], ...cueImg };
                    assignment[2] = { ...arr[2], ...colouredImgs[0] };
                    assignment[3] = { ...arr[3], ...colouredImgs[1] };

                    if (trial.regularity) {
                        // Target goes in the slot immediately next to the cue
                        assignment[1] = { ...arr[1], ...targetImg };
                        for (let i = 0; i < 14; i++) {
                            assignment[4 + i] = { ...arr[4 + i], ...grayImgs[i] };
                        }
                    } else {
                        // Slot 1 gets a gray distractor; target goes to a random slot from 4–17
                        assignment[1] = { ...arr[1], ...grayImgs[0] };
                        const targetSlot = 4 + Math.floor(Math.random() * 14);
                        assignment[targetSlot] = { ...arr[targetSlot], ...targetImg };
                        let gi = 1;
                        for (let i = 4; i < 18; i++) {
                            if (i === targetSlot) continue;
                            assignment[i] = { ...arr[i], ...grayImgs[gi++] };
                        }
                    }

                    imagePositions = assignment;
                    targetItem = imagePositions.find(item => baseName(item.src).startsWith('target_'));

                    // Show coloured images first; add gray images 700 ms later
                    drawSearchDisplay(false);
                    searchStartTime = performance.now();
                    let spacePressed = false;
                    self.jsPsych.pluginAPI.setTimeout(function() {
                        if (!spacePressed) drawSearchDisplay(true);
                    }, 700);

                    function spaceHandler(e) {
                        if (e.code !== 'Space' || phase !== 'search') return;
                        e.preventDefault();
                        spacePressed = true;
                        response.search_rt = performance.now() - searchStartTime;
                        document.removeEventListener('keydown', spaceHandler);
                        startVerification();
                    }
                    document.addEventListener('keydown', spaceHandler);
                });
            }

            function startVerification() {
                phase = 'verification';
                drawVerificationDisplay();
                verifyStartTime = performance.now();

                function keyHandler(e) {
                    if (phase !== 'verification') return;
                    const key = e.key.toUpperCase();
                    if (!verificationLetters.map(l => l.letter).includes(key)) return;
                    response.verification_key     = key;
                    response.verification_correct = (key === targetLetter);
                    response.verification_rt      = performance.now() - verifyStartTime;
                    document.removeEventListener('keydown', keyHandler);
                    drawVerificationFeedback(key);
                    self.jsPsych.pluginAPI.setTimeout(startITI, trial.feedback_duration);
                }
                document.addEventListener('keydown', keyHandler);
            }

            function drawReminder() {
                clearCanvas();
                const name = baseName(targetItem.src).replace('target_', '').replace(/_/g, ' ');
                ctx.font         = 'bold 28px Arial';
                ctx.fillStyle    = '#cc0000';
                ctx.textAlign    = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Find the ' + name + '!', cx, cy - 110);
                ctx.drawImage(targetItem.img, cx - 80, cy - 80, 160, 160);
            }

            function startITI() {
                phase = 'iti';
                if (!response.verification_correct) {
                    drawReminder();
                    self.jsPsych.pluginAPI.setTimeout(function() {
                        clearCanvas();
                        self.jsPsych.pluginAPI.setTimeout(endTrial, trial.iti_duration);
                    }, trial.reminder_duration);
                } else {
                    clearCanvas();
                    self.jsPsych.pluginAPI.setTimeout(endTrial, trial.iti_duration);
                }
            }

            function endTrial() {
                self.jsPsych.pluginAPI.clearAllTimeouts();
                display_element.innerHTML = '';
                self.jsPsych.finishTrial({
                    search_rt:            response.search_rt,
                    target_name:          targetItem ? baseName(targetItem.src) : null,
                    target_letter:        targetLetter,
                    verification_key:     response.verification_key,
                    verification_correct: response.verification_correct,
                    verification_rt:      response.verification_rt,
                    regularity:           trial.regularity,
                    cue_name:             trial.cue_name,
                    target_side:          trial.target_side,
                    image_positions:      imagePositions.map(function(item) {
                        return { src: item.src, x: item.x, y: item.y, w: item.w, h: item.h };
                    })
                });
            }

            startFixation();

        } // end trial()
    } // end class

    VisualSearchPlugin.info = info;
    return VisualSearchPlugin;

})(jsPsychModule);
