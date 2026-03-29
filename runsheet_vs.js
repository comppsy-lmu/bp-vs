// Runsheet for the visual search task.
// 8 blocks × 24 trials + 8-trial practice block.
// s1: blocks 1–4 regular, 5–8 random
// s2: blocks 1–4 random,  5–8 regular
// target_side (left/right) is randomised once per participant.

var N_TRIALS_PER_BLOCK = 8; // change to 24 later
var N_AFC_STORE        = 8;  // store first 8 trials per block for AFC

// Cue (biggest coloured) distractor per block
var cueName = {
    0: 'coloured_dictionary',
    1: 'coloured_soap_bottle',
    2: 'coloured_watermelon',
    3: 'coloured_paperlantern',
    4: 'coloured_dollhouse',
    5: 'coloured_sponge',
    6: 'coloured_frame',
    7: 'coloured_icecream',
    8: 'coloured_telephone_box'
};

// Human-readable target names per block (0 = practice)
var targetDisplayName = {
    0: 'keyboard',
    1: 'chicken',
    2: 'book',
    3: 'boombox',
    4: 'drum',
    5: 'microscope',
    6: 'vase',
    7: 'mixer',
    8: 'remote'
};

// Helper: get target image src for a set
function targetSrc(setNumber) {
    return imageSets[setNumber].find(function(src) {
        return src.split('/').pop().startsWith('target_');
    });
}

// ── Pre-block intro screen ────────────────────────────────────────────────────
function makeBlockIntroTrial(blockNum, extraNote) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function() {
            var name = targetDisplayName[blockNum];
            var src  = targetSrc(blockNum);
            var note = extraNote
                ? '<p style="font-size:18px; color:#555; max-width:580px; margin:16px auto 0;">' + extraNote + '</p>'
                : '';
            return '<div style="text-align:center; font-family:Arial; margin-top:60px;">' +
                   '<p style="font-size:28px; font-weight:bold;">Find the <em>' + name + '</em> as fast as possible!</p>' +
                   '<img src="' + src + '" style="width:200px; margin-top:20px;" />' +
                   note +
                   '<p style="font-size:18px; color:#666; margin-top:30px;">Press any key to begin.</p>' +
                   '</div>';
        },
        choices: 'ALL_KEYS'
    };
}

var practiceIntroTrial = makeBlockIntroTrial(0,
    'This is a practice block. Press <strong>spacebar as fast as possible</strong> as soon as you know where the target is — ' +
    'your reaction time is what counts!'
);

// ── End-of-block feedback screen ─────────────────────────────────────────────
function makeBlockEndTrial(blockNum) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function() {
            var trials   = jsPsych.data.get().filter({ block: blockNum, trial_type: 'visual-search' }).values();
            var correct  = trials.filter(function(t) { return t.verification_correct === true; });
            var accuracy = trials.length > 0 ? Math.round(correct.length / trials.length * 100) : 0;
            var avgRT    = correct.length > 0
                ? Math.round(correct.reduce(function(s, t) { return s + t.search_rt; }, 0) / correct.length)
                : 0;

            var html = '<div style="text-align:center; font-family:Arial; max-width:620px; margin:80px auto;">';
            html += '<p style="font-size:26px; font-weight:bold;">' + (blockNum === 0 ? 'End of practice block' : 'End of block ' + blockNum) + '</p>';
            html += '<p style="font-size:22px;">Accuracy: <strong>' + accuracy + '%</strong></p>';
            html += '<p style="font-size:22px;">Average response time: <strong>' + avgRT + ' ms</strong></p>';
            if (blockNum === 0) {
                html += '<p style="font-size:20px; color:#228822; margin-top:20px;">Practice complete! The real experiment is about to begin.</p>';
            } else if (blockNum < 8) {
                html += '<p style="font-size:20px; color:#cc5500; margin-top:20px;">Try to be faster in the next block!</p>';
            }
            html += '<p style="font-size:18px; color:#666; margin-top:30px;">Press any key to continue.</p>';
            html += '</div>';
            return html;
        },
        choices: 'ALL_KEYS'
    };
}

// Lazily initialised once on first trial
var vs_target_side = null;
function getTargetSide() {
    if (!vs_target_side) {
        vs_target_side = jsPsych.randomization.sampleWithoutReplacement(['left', 'right'], 1)[0];
    }
    return vs_target_side;
}

// s1: blocks 1–4 regular; s2: blocks 5–8 regular
function hasRegularity(block) {
    if (condition_assignment === 's1') return block <= 4;
    if (condition_assignment === 's2') return block >= 5;
    return false;
}

// Gray distractors only (no target_, no coloured_) — eligible for duplication
function grayDistractors(setNumber) {
    return imageSets[setNumber].filter(function(src) {
        var name = src.split('/').pop();
        return !name.startsWith('target_') && !name.startsWith('coloured_');
    });
}

// ── Storage for AFC ───────────────────────────────────────────────────────────
var vst_stored_trials = [];
var vst_block_counts  = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0 };

// Build a single VST trial for a given block
// trialNum and totalTrials are passed directly for the on-screen counter
function makeVSTrial(setNumber, trialNum, totalTrials, isPractice) {
    var distractors = grayDistractors(setNumber);
    return {
        type: jsPsychVisualSearch,
        images: function() {
            var extra = jsPsych.randomization.sampleWithReplacement(distractors, 6);
            return imageSets[setNumber].concat(extra);
        },
        background_colour: 'white',
        image_size:              [160, 160],
        coloured_image_size:     [160, 160],
        biggest_distractor_size: [400, 400],
        cue_name:    cueName[setNumber],
        regularity:  isPractice ? false : function() { return hasRegularity(setNumber); },
        target_side: function() { return getTargetSide(); },
        fixation_duration: 500,
        feedback_duration: 1000,
        iti_duration: 500,
        trial_num:  trialNum,
        n_trials:   totalTrials,
        show_rt:    isPractice ? true : false,
        data: { block: setNumber },
        on_finish: function(data) {
            var b = data.block;
            if (b >= 1 && vst_block_counts[b] < N_AFC_STORE) {
                vst_stored_trials.push({
                    block:           b,
                    regularity:      data.regularity,
                    cue_name:        data.cue_name,
                    target_side:     data.target_side,
                    image_positions: data.image_positions
                });
                vst_block_counts[b]++;
            }
        }
    };
}

// Build practice block (set 0, 10 trials, no regularity, show RT)
var N_PRACTICE = 8;
var practiceTrials = [];
for (var pt = 0; pt < N_PRACTICE; pt++) {
    practiceTrials.push(makeVSTrial(0, pt + 1, N_PRACTICE, true));
}
var vsPracticeBlock = { timeline: practiceTrials };

// Build all 8 VST blocks
var vsBlocks = [];
for (var block = 1; block <= 8; block++) {
    var trials = [];
    for (var t = 0; t < N_TRIALS_PER_BLOCK; t++) {
        trials.push(makeVSTrial(block, t + 1, N_TRIALS_PER_BLOCK, false));
    }
    vsBlocks.push({ timeline: trials });
}

// ── 2AFC block ────────────────────────────────────────────────────────────────
// Trials in order: 10 per block (blocks 1–8), with a break screen between blocks.

function makeAFCBreakScreen(blockLabel) {
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: '<p style="font-size:28px; font-family:Arial;">' + blockLabel + '</p>' +
                  '<p style="font-size:20px; font-family:Arial; color:#555;">Press any key to continue.</p>',
        choices: 'ALL_KEYS'
    };
}

// Build 64 AFC trial objects (8 per block × 8 blocks)
var afcTrials = [];
for (var ai = 0; ai < 64; ai++) {
    (function(idx) {
        afcTrials.push({
            type: jsPsychTwoAFC,
            stored_trial: function() { return vst_stored_trials[idx]; },
            background_colour: 'white',
            image_size:              [160, 160],
            biggest_distractor_size: [400, 400],
            iti_duration: 500
        });
    })(ai);
}

var afcInstruction = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div style="max-width:700px; margin:80px auto; text-align:center; font-family:Arial;">' +
              '<p style="font-size:26px; font-weight:bold;">Memory task</p>' +
              '<p style="font-size:20px;">You will now see some of the search displays from each block <strong>again</strong> — but <strong>without the target</strong> object.</p>' +
              '<p style="font-size:20px;"><strong>Two empty boxes</strong> will appear where two objects were previously shown. Click on the box where you think the <strong>target</strong> was. One of the choice options is always correct, that is, the target was in either of the two locations.</p>' +
              '<p style="font-size:20px;">Then rate how confident you are in your choice (50% = guess, 100% = extremely confident).</p>' +
              '<p style="font-size:20px;">This is the final part of the experiment.</p>' +
              '<p style="font-size:18px; color:#555; margin-top:30px;">Press any key to begin.</p>' +
              '</div>',
    choices: 'ALL_KEYS'
};

var vsAFCBlock = {
    timeline: [
        afcInstruction,
        makeAFCBreakScreen('Block 1'),
        afcTrials[0],  afcTrials[1],  afcTrials[2],  afcTrials[3],
        afcTrials[4],  afcTrials[5],  afcTrials[6],  afcTrials[7],
        makeAFCBreakScreen('Block 2'),
        afcTrials[8],  afcTrials[9],  afcTrials[10], afcTrials[11],
        afcTrials[12], afcTrials[13], afcTrials[14], afcTrials[15],
        makeAFCBreakScreen('Block 3'),
        afcTrials[16], afcTrials[17], afcTrials[18], afcTrials[19],
        afcTrials[20], afcTrials[21], afcTrials[22], afcTrials[23],
        makeAFCBreakScreen('Block 4'),
        afcTrials[24], afcTrials[25], afcTrials[26], afcTrials[27],
        afcTrials[28], afcTrials[29], afcTrials[30], afcTrials[31],
        makeAFCBreakScreen('Block 5'),
        afcTrials[32], afcTrials[33], afcTrials[34], afcTrials[35],
        afcTrials[36], afcTrials[37], afcTrials[38], afcTrials[39],
        makeAFCBreakScreen('Block 6'),
        afcTrials[40], afcTrials[41], afcTrials[42], afcTrials[43],
        afcTrials[44], afcTrials[45], afcTrials[46], afcTrials[47],
        makeAFCBreakScreen('Block 7'),
        afcTrials[48], afcTrials[49], afcTrials[50], afcTrials[51],
        afcTrials[52], afcTrials[53], afcTrials[54], afcTrials[55],
        makeAFCBreakScreen('Block 8'),
        afcTrials[56], afcTrials[57], afcTrials[58], afcTrials[59],
        afcTrials[60], afcTrials[61], afcTrials[62], afcTrials[63]
    ]
};
