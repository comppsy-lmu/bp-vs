// Image sets for the visual search task.
// Each set contains 12 images: 1 target (target_*), 3 coloured (coloured_*),
// and 8 grayscale distractors.
// Set 0 = practice set.

var stimulusBase = 'stimulus sets/';

var imageSets = {
    0: [
        stimulusBase + 'practice set/target_keyboard.jpg',
        stimulusBase + 'practice set/coloured_slinky.jpg',
        stimulusBase + 'practice set/coloured_juice.jpg',
        stimulusBase + 'practice set/coloured_dictionary.jpg',
        stimulusBase + 'practice set/alarm_clock.jpg',
        stimulusBase + 'practice set/box.jpg',
        stimulusBase + 'practice set/cd.jpg',
        stimulusBase + 'practice set/hairbrush.jpg',
        stimulusBase + 'practice set/iron.jpg',
        stimulusBase + 'practice set/jumprope.jpg',
        stimulusBase + 'practice set/lemon.jpg',
        stimulusBase + 'practice set/teakettle.jpg'
    ],
    1: [
        stimulusBase + 'set 1/target_chicken.jpg',
        stimulusBase + 'set 1/coloured_banana.jpg',
        stimulusBase + 'set 1/coloured_cupcake.jpg',
        stimulusBase + 'set 1/coloured_soap_bottle.jpg',
        stimulusBase + 'set 1/alarm_clock.jpg',
        stimulusBase + 'set 1/baby_bottle.jpg',
        stimulusBase + 'set 1/cd.jpg',
        stimulusBase + 'set 1/hairbrush.jpg',
        stimulusBase + 'set 1/lemon.jpg',
        stimulusBase + 'set 1/spoon.jpg',
        stimulusBase + 'set 1/tennisball.jpg',
        stimulusBase + 'set 1/whisk.jpg'
    ],
    2: [
        stimulusBase + 'set 2/target_book.jpg',
        stimulusBase + 'set 2/coloured_popcorn.jpg',
        stimulusBase + 'set 2/coloured_trumpet.jpg',
        stimulusBase + 'set 2/coloured_watermelon.jpg',
        stimulusBase + 'set 2/MacBook.jpg',
        stimulusBase + 'set 2/burger.jpg',
        stimulusBase + 'set 2/camera.jpg',
        stimulusBase + 'set 2/fishbowl.jpg',
        stimulusBase + 'set 2/jumprope.jpg',
        stimulusBase + 'set 2/rollingpin.jpg',
        stimulusBase + 'set 2/stethoscope.jpg',
        stimulusBase + 'set 2/volleyball.jpg'
    ],
    3: [
        stimulusBase + 'set 3/target_boombox.jpg',
        stimulusBase + 'set 3/coloured_paperlantern.jpg',
        stimulusBase + 'set 3/coloured_tambourine.jpg',
        stimulusBase + 'set 3/coloured_umbrella.jpg',
        stimulusBase + 'set 3/iron.jpg',
        stimulusBase + 'set 3/loudspeaker.jpg',
        stimulusBase + 'set 3/pan.jpg',
        stimulusBase + 'set 3/suitcase.jpg',
        stimulusBase + 'set 3/teakettle.jpg',
        stimulusBase + 'set 3/tennisracket.jpg',
        stimulusBase + 'set 3/water_filter.jpg',
        stimulusBase + 'set 3/weights.jpg'
    ],
    4: [
        stimulusBase + 'set 4/target_drum.jpg',
        stimulusBase + 'set 4/coloured_beachball.jpg',
        stimulusBase + 'set 4/coloured_dollhouse.jpg',
        stimulusBase + 'set 4/coloured_guitar.jpg',
        stimulusBase + 'set 4/box.jpg',
        stimulusBase + 'set 4/christmas_tree.jpg',
        stimulusBase + 'set 4/deskchair.jpg',
        stimulusBase + 'set 4/globe.jpg',
        stimulusBase + 'set 4/mini-trampoline.jpg',
        stimulusBase + 'set 4/stepladder.jpg',
        stimulusBase + 'set 4/tricycle.jpg',
        stimulusBase + 'set 4/tv.jpg'
    ],
    5: [
        stimulusBase + 'set 5/target_microscope.jpg',
        stimulusBase + 'set 5/coloured_pet_carrier.jpg',
        stimulusBase + 'set 5/coloured_sponge.jpg',
        stimulusBase + 'set 5/coloured_tapemeasure.jpg',
        stimulusBase + 'set 5/alarm_clock.jpg',
        stimulusBase + 'set 5/baby_bottle.jpg',
        stimulusBase + 'set 5/burger.jpg',
        stimulusBase + 'set 5/camera.jpg',
        stimulusBase + 'set 5/cd.jpg',
        stimulusBase + 'set 5/globe.jpg',
        stimulusBase + 'set 5/water_filter.jpg',
        stimulusBase + 'set 5/weights.jpg'
    ],
    6: [
        stimulusBase + 'set 6/target_vase.jpg',
        stimulusBase + 'set 6/coloured_bouquet.jpg',
        stimulusBase + 'set 6/coloured_frame.jpg',
        stimulusBase + 'set 6/coloured_gameboy.jpg',
        stimulusBase + 'set 6/box.jpg',
        stimulusBase + 'set 6/christmas_tree.jpg',
        stimulusBase + 'set 6/deskchair.jpg',
        stimulusBase + 'set 6/suitcase.jpg',
        stimulusBase + 'set 6/teakettle.jpg',
        stimulusBase + 'set 6/tennisball.jpg',
        stimulusBase + 'set 6/tennisracket.jpg',
        stimulusBase + 'set 6/whisk.jpg'
    ],
    7: [
        stimulusBase + 'set 7/target_mixer.jpg',
        stimulusBase + 'set 7/coloured_balloons.jpg',
        stimulusBase + 'set 7/coloured_fire_extinguisher.jpg',
        stimulusBase + 'set 7/coloured_icecream.jpg',
        stimulusBase + 'set 7/hairbrush.jpg',
        stimulusBase + 'set 7/lemon.jpg',
        stimulusBase + 'set 7/rollingpin.jpg',
        stimulusBase + 'set 7/spoon.jpg',
        stimulusBase + 'set 7/stethoscope.jpg',
        stimulusBase + 'set 7/tricycle.jpg',
        stimulusBase + 'set 7/tv.jpg',
        stimulusBase + 'set 7/volleyball.jpg'
    ],
    8: [
        stimulusBase + 'set 8/target_remote.jpg',
        stimulusBase + 'set 8/coloured_crane.jpg',
        stimulusBase + 'set 8/coloured_knitting.jpg',
        stimulusBase + 'set 8/coloured_telephone_box.jpg',
        stimulusBase + 'set 8/MacBook.jpg',
        stimulusBase + 'set 8/fishbowl.jpg',
        stimulusBase + 'set 8/iron.jpg',
        stimulusBase + 'set 8/jumprope.jpg',
        stimulusBase + 'set 8/loudspeaker.jpg',
        stimulusBase + 'set 8/mini-trampoline.jpg',
        stimulusBase + 'set 8/pan.jpg',
        stimulusBase + 'set 8/stepladder.jpg'
    ]
};
