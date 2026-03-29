// Two-Alternative Forced Choice Plugin for jsPsych 7
// Shows stored VST trial (minus target) + two candidate positions.
// Phase 1: mouse click on one of two dashed boxes.
// Phase 2: confidence slider.

var jsPsychTwoAFC = (function (jspsych) {
    'use strict';

    const info = {
        name: 'two-afc',
        parameters: {
            stored_trial: {
                type: jspsych.ParameterType.OBJECT,
                default: null,
                description: 'Stored VST trial object (image_positions, block, regularity, etc.)'
            },
            background_colour: {
                type: jspsych.ParameterType.STRING,
                default: 'white'
            },
            image_size: {
                type: jspsych.ParameterType.INT,
                default: [160, 160]
            },
            biggest_distractor_size: {
                type: jspsych.ParameterType.INT,
                default: [300, 300]
            },
            iti_duration: {
                type: jspsych.ParameterType.INT,
                default: 500
            }
        }
    };

    class TwoAFCPlugin {

        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {

            const self = this;
            const pr   = window.devicePixelRatio || 1;
            const W    = window.innerWidth  - 20;
            const H    = window.innerHeight - 20;

            const stored = trial.stored_trial;
            const imgPositions = stored.image_positions; // [{src, x, y, w, h}]
            const bdW = trial.biggest_distractor_size[0];
            const bdH = trial.biggest_distractor_size[1];
            const imgW = trial.image_size[0];
            const imgH = trial.image_size[1];
            const GAP  = 30; // same gap used during arrangement generation

            function baseName(src) {
                return src.split('/').pop().replace(/\.[^/.]+$/, '');
            }

            // ── Compute the two candidate positions ───────────────────

            // Always show: rule-consistent position (adjacent to cue on target_side)
            const cuePosData = imgPositions.find(p => baseName(p.src) === stored.cue_name);
            const side = stored.target_side;
            const rcX  = side === 'right'
                ? cuePosData.x + bdW / 2 + imgW / 2 + GAP
                : cuePosData.x - bdW / 2 - imgW / 2 - GAP;
            const ruleConsistentPos = { x: rcX, y: cuePosData.y };

            // Second option depends on block type
            const targetPosData = imgPositions.find(p => baseName(p.src).startsWith('target_'));
            let alternativePos;

            if (stored.regularity) {
                // Regular block: target WAS at rule-consistent position → random foil
                const candidates = imgPositions.filter(p => {
                    const name = baseName(p.src);
                    if (name.startsWith('target_')) return false;
                    if (name === stored.cue_name)   return false;
                    if (name.startsWith('coloured_')) return false;
                    // Not overlapping with rule-consistent position
                    if (Math.abs(p.x - rcX) < imgW && Math.abs(p.y - cuePosData.y) < imgH) return false;
                    return true;
                });
                const foil = self.jsPsych.randomization.sampleWithoutReplacement(candidates, 1)[0];
                alternativePos = { x: foil.x, y: foil.y };
            } else {
                // Random block: target was NOT at rule-consistent position → actual target position
                alternativePos = { x: targetPosData.x, y: targetPosData.y };
            }

            // Randomly order the two options so rule-consistent isn't always on the same side
            const options = self.jsPsych.randomization.shuffle([
                { pos: ruleConsistentPos, type: 'rule_consistent' },
                { pos: alternativePos,    type: 'alternative'     }
            ]);

            // Correct answer = where the target actually was
            const correctType = stored.regularity ? 'rule_consistent' : 'alternative';

            const response = {
                choice:          null,
                choice_correct:  null,
                choice_rt:       null,
                confidence:      null
            };

            // ── Phase 1: Canvas display ───────────────────────────────
            display_element.innerHTML =
                `<style>
                  #twoafc-canvas { display:block; cursor:pointer; }
                  .jspsych-content-wrapper { width:100% !important; }
                  .jspsych-content { max-width:100% !important; padding:0 !important; }
                </style>
                <canvas id="twoafc-canvas"></canvas>`;

            const canvas = document.getElementById('twoafc-canvas');
            const ctx    = canvas.getContext('2d');
            canvas.width        = W * pr;
            canvas.height       = H * pr;
            canvas.style.width  = W + 'px';
            canvas.style.height = H + 'px';
            ctx.scale(pr, pr);

            // Load all images except target and except images sitting at either candidate position
            // (both candidate spots must appear as empty dashed boxes)
            const toLoad = imgPositions.filter(p => {
                if (baseName(p.src).startsWith('target_')) return false;
                const atRC  = Math.abs(p.x - ruleConsistentPos.x) < 5 && Math.abs(p.y - ruleConsistentPos.y) < 5;
                const atAlt = Math.abs(p.x - alternativePos.x)    < 5 && Math.abs(p.y - alternativePos.y)    < 5;
                return !atRC && !atAlt;
            });
            const loadedImgs = [];
            let loadedCount = 0;

            function onAllLoaded() {
                drawDisplay(null);
                addListeners();
            }

            toLoad.forEach(function (posData) {
                const img = new Image();
                img.onload = img.onerror = function () {
                    loadedCount++;
                    if (loadedCount === toLoad.length) onAllLoaded();
                };
                img.src = posData.src;
                loadedImgs.push({ img, posData });
            });
            if (toLoad.length === 0) onAllLoaded();

            function drawDisplay(hoveredType) {
                ctx.fillStyle = trial.background_colour;
                ctx.fillRect(0, 0, W, H);

                // Draw all images except target
                for (const { img, posData } of loadedImgs) {
                    ctx.drawImage(
                        img,
                        posData.x - posData.w / 2,
                        posData.y - posData.h / 2,
                        posData.w,
                        posData.h
                    );
                }

                // Draw the two candidate boxes
                for (const opt of options) {
                    const hovered = hoveredType === opt.type;
                    ctx.save();
                    ctx.setLineDash([10, 5]);
                    ctx.lineWidth   = hovered ? 4 : 2.5;
                    ctx.strokeStyle = hovered ? '#0055cc' : '#555';
                    ctx.strokeRect(opt.pos.x - imgW / 2, opt.pos.y - imgH / 2, imgW, imgH);
                    if (hovered) {
                        ctx.fillStyle = 'rgba(0, 85, 204, 0.12)';
                        ctx.fillRect(opt.pos.x - imgW / 2, opt.pos.y - imgH / 2, imgW, imgH);
                    }
                    ctx.restore();
                }

                // Instruction drawn last so it always appears on top
                ctx.font      = '22px Arial';
                ctx.fillStyle = '#333';
                ctx.textAlign = 'center';
                ctx.fillText('Where was the target? Click on the correct position.', W / 2, 35);
            }

            const startTime = performance.now();

            function addListeners() {
                canvas.addEventListener('mousemove', function (e) {
                    const rect = canvas.getBoundingClientRect();
                    const mx   = e.clientX - rect.left;
                    const my   = e.clientY - rect.top;
                    let hovered = null;
                    for (const opt of options) {
                        if (mx >= opt.pos.x - imgW / 2 && mx <= opt.pos.x + imgW / 2 &&
                            my >= opt.pos.y - imgH / 2 && my <= opt.pos.y + imgH / 2) {
                            hovered = opt.type;
                        }
                    }
                    drawDisplay(hovered);
                });

                function clickHandler(e) {
                    const rect = canvas.getBoundingClientRect();
                    const mx   = e.clientX - rect.left;
                    const my   = e.clientY - rect.top;
                    for (const opt of options) {
                        if (mx >= opt.pos.x - imgW / 2 && mx <= opt.pos.x + imgW / 2 &&
                            my >= opt.pos.y - imgH / 2 && my <= opt.pos.y + imgH / 2) {
                            canvas.removeEventListener('click', clickHandler);
                            response.choice         = opt.type;
                            response.choice_correct = (opt.type === correctType);
                            response.choice_rt      = performance.now() - startTime;
                            showConfidence();
                            return;
                        }
                    }
                }
                canvas.addEventListener('click', clickHandler);
            }

            // ── Phase 2: Confidence slider ────────────────────────────
            function showConfidence() {
                display_element.innerHTML = `
                    <div style="width:800px; margin:100px auto; text-align:center; font-family:Arial;">
                        <p style="font-size:24px; margin-bottom:30px;">
                            How confident are you in your choice?
                        </p>
                        <div style="display:flex; justify-content:space-between; font-size:20px; margin-bottom:10px;">
                            <span>Not confident at all</span>
                            <span>Very confident</span>
                        </div>
                        <div id="conf-track" style="
                            width:100%; height:60px;
                            background:linear-gradient(to right, #ff4444, #ffaa00, #44ff44);
                            border-radius:10px; cursor:pointer; position:relative; margin:20px 0;">
                        </div>
                        <div id="conf-value" style="font-size:36px; font-weight:bold; min-height:44px;"></div>
                        <p style="font-size:18px; color:#666; margin-top:10px;">
                            Move mouse over the bar and click to confirm
                        </p>
                    </div>`;

                const track   = document.getElementById('conf-track');
                const display = document.getElementById('conf-value');
                let clicked   = false;

                track.addEventListener('mousemove', function (e) {
                    if (clicked) return;
                    const rect = track.getBoundingClientRect();
                    const pct  = Math.round(50 + Math.max(0, Math.min(50,
                        (e.clientX - rect.left) / rect.width * 50)));
                    display.textContent = pct + '%';
                });

                track.addEventListener('click', function (e) {
                    if (clicked) return;
                    clicked = true;
                    const rect = track.getBoundingClientRect();
                    const pct  = Math.round(50 + Math.max(0, Math.min(50,
                        (e.clientX - rect.left) / rect.width * 50)));
                    response.confidence = pct;
                    self.jsPsych.pluginAPI.setTimeout(endTrial, trial.iti_duration);
                });
            }

            // ── End trial ─────────────────────────────────────────────
            function endTrial() {
                self.jsPsych.pluginAPI.clearAllTimeouts();
                display_element.innerHTML = '';
                self.jsPsych.finishTrial({
                    block:                stored.block,
                    regularity:           stored.regularity,
                    cue_name:             stored.cue_name,
                    target_side:          stored.target_side,
                    choice:               response.choice,
                    choice_rule_consistent: response.choice === 'rule_consistent',
                    choice_correct:       response.choice_correct,
                    choice_rt:            response.choice_rt,
                    confidence:           response.confidence
                });
            }

        } // end trial()
    } // end class

    TwoAFCPlugin.info = info;
    return TwoAFCPlugin;

})(jsPsychModule);
