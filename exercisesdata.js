import { EXERCISE_NAMES_AR, DAY_TITLES_AR, LEVELS_AR, durationAr } from './ar_exercises';
import { LANG } from './i18n';

const AR_UI = LANG === 'ar';

// الفيديوهات والصور كلها جوه التطبيق (assets/videos و assets/exercises)
// كل الفيديوهات من غير صوت (الصوت متشال من الملف نفسه + المشغل mute)
// الصور متاخدة من نص كل فيديو
export const EXERCISE_LIBRARY = {
  // --- CARDIO & HIIT ---
  jumping_jacks: {
    id: 'jumping_jacks',
    name: 'Jumping Jacks',
    type: 'time',
    image: require('./assets/exercises/jumping-jacks.jpg'),
    video: require('./assets/videos/jumping-jacks.mp4')
  },
  high_knees: {
    id: 'high_knees',
    name: 'High Knees',
    type: 'time',
    image: require('./assets/exercises/high-knees.jpg'),
    video: require('./assets/videos/high-knees.mp4')
  },
  burpees: {
    id: 'burpees',
    name: 'Burpees',
    type: 'reps',
    image: require('./assets/exercises/burpees.jpg'),
    video: require('./assets/videos/burpees.mp4')
  },
  mountain_climbers: {
    id: 'mountain_climbers',
    name: 'Mountain Climbers',
    type: 'time',
    image: require('./assets/exercises/mountain-climbers.jpg'),
    video: require('./assets/videos/mountain-climbers.mp4')
  },
  butt_kicks: {
    id: 'butt_kicks',
    name: 'Butt Kicks',
    type: 'time',
    image: require('./assets/exercises/butt-kicks.jpg'),
    video: require('./assets/videos/butt-kicks.mp4')
  },

  // --- LEGS & GLUTES ---
  squats: {
    id: 'squats',
    name: 'Squats',
    type: 'reps',
    image: require('./assets/exercises/squats.jpg'),
    video: require('./assets/videos/squats.mp4')
  },
  lunges: {
    id: 'lunges',
    name: 'Forward Lunges',
    type: 'reps',
    image: require('./assets/exercises/forward-lunges.jpg'),
    video: require('./assets/videos/forward-lunges.mp4')
  },
  glute_bridges: {
    id: 'glute_bridges',
    name: 'Glute Bridges',
    type: 'reps',
    image: require('./assets/exercises/glute-bridges.jpg'),
    video: require('./assets/videos/glute-bridges.mp4')
  },
  calf_raises: {
    id: 'calf_raises',
    name: 'Calf Raises',
    type: 'reps',
    image: require('./assets/exercises/calf-raises.jpg'),
    video: require('./assets/videos/calf-raises.mp4')
  },
  wall_sit: {
    id: 'wall_sit',
    name: 'Wall Sit',
    type: 'time',
    image: require('./assets/exercises/wall-sit.jpg'),
    video: require('./assets/videos/wall-sit.mp4')
  },
  side_lunges: {
    id: 'side_lunges',
    name: 'Side Lunges',
    type: 'reps',
    image: require('./assets/exercises/side-lunges.jpg'),
    video: require('./assets/videos/side-lunges.mp4')
  },

  // --- UPPER BODY (CHEST, ARMS, BACK) ---
  push_ups: {
    id: 'push_ups',
    name: 'Push Ups',
    type: 'reps',
    image: require('./assets/exercises/push-ups.jpg'),
    video: require('./assets/videos/push-ups.mp4')
  },
  diamond_push_ups: {
    id: 'diamond_push_ups',
    name: 'Diamond Push Ups',
    type: 'reps',
    image: require('./assets/exercises/diamond-push-ups.jpg'),
    video: require('./assets/videos/diamond-push-ups.mp4')
  },
  tricep_dips: {
    id: 'tricep_dips',
    name: 'Tricep Dips',
    type: 'reps',
    image: require('./assets/exercises/tricep-dips.jpg'),
    video: require('./assets/videos/tricep-dips.mp4')
  },
  arm_circles: {
    id: 'arm_circles',
    name: 'Arm Circles',
    type: 'time',
    image: require('./assets/exercises/arm-circles.jpg'),
    video: require('./assets/videos/arm-circles.mp4')
  },
  pike_push_ups: {
    id: 'pike_push_ups',
    name: 'Pike Push Ups',
    type: 'reps',
    image: require('./assets/exercises/pike-push-ups.jpg'),
    video: require('./assets/videos/pike-push-ups.mp4')
  },

  // --- CORE & ABS ---
  plank: {
    id: 'plank',
    name: 'Plank',
    type: 'time',
    image: require('./assets/exercises/plank.jpg'),
    video: require('./assets/videos/plank.mp4')
  },
  crunches: {
    id: 'crunches',
    name: 'Crunches',
    type: 'reps',
    image: require('./assets/exercises/crunches.jpg'),
    video: require('./assets/videos/crunches.mp4')
  },
  leg_raises: {
    id: 'leg_raises',
    name: 'Leg Raises',
    type: 'reps',
    image: require('./assets/exercises/leg-raises.jpg'),
    video: require('./assets/videos/leg-raises.mp4')
  },
  russian_twists: {
    id: 'russian_twists',
    name: 'Russian Twists',
    type: 'reps',
    image: require('./assets/exercises/russian-twists.jpg'),
    video: require('./assets/videos/russian-twists.mp4')
  },
  bicycle_crunches: {
    id: 'bicycle_crunches',
    name: 'Bicycle Crunches',
    type: 'time',
    image: require('./assets/exercises/bicycle-crunches.jpg'),
    video: require('./assets/videos/bicycle-crunches.mp4')
  },
  superman: {
    id: 'superman',
    name: 'Superman',
    type: 'time',
    image: require('./assets/exercises/superman.jpg'),
    video: require('./assets/videos/superman.mp4')
  },
  
  // --- WARM-UP & MOBILITY ---
  neck_rolls: {
    id: 'neck_rolls',
    name: 'Neck Rolls',
    type: 'time',
    image: require('./assets/exercises/neck-rolls.jpg'),
    video: require('./assets/videos/neck-rolls.mp4')
  },
  shoulder_rolls: {
    id: 'shoulder_rolls',
    name: 'Shoulder Rolls',
    type: 'time',
    image: require('./assets/exercises/shoulder-rolls.jpg'),
    video: require('./assets/videos/shoulder-rolls.mp4')
  },
  hip_circles: {
    id: 'hip_circles',
    name: 'Hip Circles',
    type: 'time',
    image: require('./assets/exercises/hip-circles.jpg'),
    video: require('./assets/videos/hip-circles.mp4')
  },
  knee_circles: {
    id: 'knee_circles',
    name: 'Knee Circles',
    type: 'time',
    image: require('./assets/exercises/knee-circles.jpg'),
    video: require('./assets/videos/knee-circles.mp4')
  },
  ankle_circles: {
    id: 'ankle_circles',
    name: 'Ankle Circles',
    type: 'time',
    image: require('./assets/exercises/ankle-circles.jpg'),
    video: require('./assets/videos/ankle-circles.mp4')
  },
  cat_cow_stretch: {
    id: 'cat_cow_stretch',
    name: 'Cat-Cow Stretch',
    type: 'time',
    image: require('./assets/exercises/cat-cow-stretch.jpg'),
    video: require('./assets/videos/cat-cow-stretch.mp4')
  },
  standing_toe_touch: {
    id: 'standing_toe_touch',
    name: 'Standing Toe Touch',
    type: 'reps',
    image: require('./assets/exercises/standing-toe-touch.jpg'),
    video: require('./assets/videos/standing-toe-touch.mp4')
  },
  inchworms: {
    id: 'inchworms',
    name: 'Inchworms',
    type: 'reps',
    image: require('./assets/exercises/inchworms.jpg'),
    video: require('./assets/videos/inchworms.mp4')
  },

  // --- CARDIO & HIIT (NEW) ---
  step_jacks: {
    id: 'step_jacks',
    name: 'Step Jacks',
    type: 'time',
    image: require('./assets/exercises/step-jacks.jpg'),
    video: require('./assets/videos/step-jacks.mp4')
  },
  seal_jacks: {
    id: 'seal_jacks',
    name: 'Seal Jacks',
    type: 'time',
    image: require('./assets/exercises/seal-jacks.jpg'),
    video: require('./assets/videos/seal-jacks.mp4')
  },
  half_burpees: {
    id: 'half_burpees',
    name: 'Half Burpees',
    type: 'reps',
    image: require('./assets/exercises/half-burpees.jpg'),
    video: require('./assets/videos/half-burpees.mp4')
  },
  cross_mountain_climbers: {
    id: 'cross_mountain_climbers',
    name: 'Cross Mountain Climbers',
    type: 'time',
    image: require('./assets/exercises/cross-mountain-climbers.jpg'),
    video: require('./assets/videos/cross-mountain-climbers.mp4')
  },
  spot_running: {
    id: 'spot_running',
    name: 'Spot Running',
    type: 'time',
    image: require('./assets/exercises/spot-running.jpg'),
    video: require('./assets/videos/spot-running.mp4')
  },
  lunge_jumps: {
    id: 'lunge_jumps',
    name: 'Lunge Jumps',
    type: 'reps',
    image: require('./assets/exercises/lunge-jumps.jpg'),
    video: require('./assets/videos/lunge-jumps.mp4')
  },
  fast_feet: {
    id: 'fast_feet',
    name: 'Fast Feet',
    type: 'time',
    image: require('./assets/exercises/fast-feet.jpg'),
    video: require('./assets/videos/fast-feet.mp4')
  },
  skater_jumps: {
    id: 'skater_jumps',
    name: 'Skater Jumps',
    type: 'time',
    image: require('./assets/exercises/skater-jumps.jpg'),
    video: require('./assets/videos/skater-jumps.mp4')
  },
  squat_jumps: {
    id: 'squat_jumps',
    name: 'Squat Jumps',
    type: 'reps',
    image: require('./assets/exercises/squat-jumps.jpg'),
    video: require('./assets/videos/squat-jumps.mp4')
  },
  tuck_jumps: {
    id: 'tuck_jumps',
    name: 'Tuck Jumps',
    type: 'reps',
    image: require('./assets/exercises/tuck-jumps.jpg'),
    video: require('./assets/videos/tuck-jumps.mp4')
  },
  frog_jumps: {
    id: 'frog_jumps',
    name: 'Frog Jumps',
    type: 'reps',
    image: require('./assets/exercises/frog-jumps.jpg'),
    video: require('./assets/videos/frog-jumps.mp4')
  },
  lateral_shuffle: {
    id: 'lateral_shuffle',
    name: 'Lateral Shuffle',
    type: 'time',
    image: require('./assets/exercises/lateral-shuffle.jpg'),
    video: require('./assets/videos/lateral-shuffle.mp4')
  },
  bear_crawl: {
    id: 'bear_crawl',
    name: 'Bear Crawl',
    type: 'time',
    image: require('./assets/exercises/bear-crawl.jpg'),
    video: require('./assets/videos/bear-crawl.mp4')
  },
  crab_walk: {
    id: 'crab_walk',
    name: 'Crab Walk',
    type: 'time',
    image: require('./assets/exercises/crab-walk.jpg'),
    video: require('./assets/videos/crab-walk.mp4')
  },

  // --- LEGS & GLUTES (NEW) ---
  pulsing_squats: {
    id: 'pulsing_squats',
    name: 'Pulsing Squats',
    type: 'time',
    image: require('./assets/exercises/pulsing-squats.jpg'),
    video: require('./assets/videos/pulsing-squats.mp4')
  },
  curtsy_lunges: {
    id: 'curtsy_lunges',
    name: 'Curtsy Lunges',
    type: 'reps',
    image: require('./assets/exercises/curtsy-lunges.jpg'),
    video: require('./assets/videos/curtsy-lunges.mp4')
  },
  single_leg_glute_bridge: {
    id: 'single_leg_glute_bridge',
    name: 'Single Leg Glute Bridge',
    type: 'reps',
    image: require('./assets/exercises/single-leg-glute-bridge.jpg'),
    video: require('./assets/videos/single-leg-glute-bridge.mp4')
  },
  step_ups: {
    id: 'step_ups',
    name: 'Step-ups',
    type: 'reps',
    image: require('./assets/exercises/step-ups.jpg'),
    video: require('./assets/videos/step-ups.mp4')
  },
  bulgarian_split_squats: {
    id: 'bulgarian_split_squats',
    name: 'Bulgarian Split Squats',
    type: 'reps',
    image: require('./assets/exercises/bulgarian-split-squats.jpg'),
    video: require('./assets/videos/bulgarian-split-squats.mp4')
  },
  fire_hydrant_left: {
    id: 'fire_hydrant_left',
    name: 'Fire Hydrant Left',
    type: 'reps',
    image: require('./assets/exercises/fire-hydrant-left.jpg'),
    video: require('./assets/videos/fire-hydrant-left.mp4')
  },
  fire_hydrant_right: {
    id: 'fire_hydrant_right',
    name: 'Fire Hydrant Right',
    type: 'reps',
    image: require('./assets/exercises/fire-hydrant-right.jpg'),
    video: require('./assets/videos/fire-hydrant-right.mp4')
  },
  single_leg_romanian_deadlift: {
    id: 'single_leg_romanian_deadlift',
    name: 'Single Leg Romanian Deadlift',
    type: 'reps',
    image: require('./assets/exercises/single-leg-romanian-deadlift.jpg'),
    video: require('./assets/videos/single-leg-romanian-deadlift.mp4')
  },

  // --- UPPER BODY (NEW) ---
  shoulder_taps: {
    id: 'shoulder_taps',
    name: 'Shoulder Taps',
    type: 'reps',
    image: require('./assets/exercises/shoulder-taps.jpg'),
    video: require('./assets/videos/shoulder-taps.mp4')
  },
  push_up_and_rotation: {
    id: 'push_up_and_rotation',
    name: 'Push-up and Rotation',
    type: 'reps',
    image: require('./assets/exercises/push-up-and-rotation.jpg'),
    video: require('./assets/videos/push-up-and-rotation.mp4')
  },
  cobra_push_ups: {
    id: 'cobra_push_ups',
    name: 'Cobra Push-ups',
    type: 'reps',
    image: require('./assets/exercises/cobra-push-ups.jpg'),
    video: require('./assets/videos/cobra-push-ups.mp4')
  },
  archer_push_ups: {
    id: 'archer_push_ups',
    name: 'Archer Push-ups',
    type: 'reps',
    image: require('./assets/exercises/archer-push-ups.jpg'),
    video: require('./assets/videos/archer-push-ups.mp4')
  },
  wall_push_ups: {
    id: 'wall_push_ups',
    name: 'Wall Push-ups',
    type: 'reps',
    image: require('./assets/exercises/wall-push-ups.jpg'),
    video: require('./assets/videos/wall-push-ups.mp4')
  },
  arm_scissors: {
    id: 'arm_scissors',
    name: 'Arm Scissors',
    type: 'time',
    image: require('./assets/exercises/arm-scissors.jpg'),
    video: require('./assets/videos/arm-scissors.mp4')
  },

  // --- CORE & ABS (NEW) ---
  high_plank: {
    id: 'high_plank',
    name: 'High Plank',
    type: 'time',
    image: require('./assets/exercises/high-plank.jpg'),
    video: require('./assets/videos/high-plank.mp4')
  },
  plank_up_downs: {
    id: 'plank_up_downs',
    name: 'Plank Up-Downs',
    type: 'reps',
    image: require('./assets/exercises/plank-up-downs.jpg'),
    video: require('./assets/videos/plank-up-downs.mp4')
  },
  heel_touch: {
    id: 'heel_touch',
    name: 'Heel Touch',
    type: 'reps',
    image: require('./assets/exercises/heel-touch.jpg'),
    video: require('./assets/videos/heel-touch.mp4')
  },
  ab_pulse: {
    id: 'ab_pulse',
    name: 'Ab Pulse',
    type: 'time',
    image: require('./assets/exercises/ab-pulse.jpg'),
    video: require('./assets/videos/ab-pulse.mp4')
  },
  bird_dog: {
    id: 'bird_dog',
    name: 'Bird Dog',
    type: 'reps',
    image: require('./assets/exercises/bird-dog.jpg'),
    video: require('./assets/videos/bird-dog.mp4')
  },
  hollow_body_hold: {
    id: 'hollow_body_hold',
    name: 'Hollow Body Hold',
    type: 'time',
    image: require('./assets/exercises/hollow-body-hold.jpg'),
    video: require('./assets/videos/hollow-body-hold.mp4')
  },
  toe_touch_crunches: {
    id: 'toe_touch_crunches',
    name: 'Toe Touch Crunches',
    type: 'reps',
    image: require('./assets/exercises/toe-touch-crunches.jpg'),
    video: require('./assets/videos/toe-touch-crunches.mp4')
  },
  scissor_kicks: {
    id: 'scissor_kicks',
    name: 'Scissor Kicks',
    type: 'time',
    image: require('./assets/exercises/scissor-kicks.jpg'),
    video: require('./assets/videos/scissor-kicks.mp4')
  },
  windshield_wipers: {
    id: 'windshield_wipers',
    name: 'Windshield Wipers',
    type: 'reps',
    image: require('./assets/exercises/windshield-wipers.jpg'),
    video: require('./assets/videos/windshield-wipers.mp4')
  },

  // --- STRETCH & COOL DOWN ---
  downward_dog: {
    id: 'downward_dog',
    name: 'Downward Dog',
    type: 'time',
    image: require('./assets/exercises/downward-dog.jpg'),
    video: require('./assets/videos/downward-dog.mp4')
  },
  hamstring_stretch: {
    id: 'hamstring_stretch',
    name: 'Hamstring Stretch',
    type: 'time',
    image: require('./assets/exercises/hamstring-stretch.jpg'),
    video: require('./assets/videos/hamstring-stretch.mp4')
  },
  hip_flexor_stretch: {
    id: 'hip_flexor_stretch',
    name: 'Hip Flexor Stretch',
    type: 'time',
    image: require('./assets/exercises/hip-flexor-stretch.jpg'),
    video: require('./assets/videos/hip-flexor-stretch.mp4')
  },

  // --- CORE & ABS (PART 2) ---
  sit_ups: {
    id: 'sit_ups',
    name: 'Sit-ups',
    type: 'reps',
    image: require('./assets/exercises/sit-ups.jpg'),
    video: require('./assets/videos/sit-ups.mp4')
  },
  flutter_kicks: {
    id: 'flutter_kicks',
    name: 'Flutter Kicks',
    type: 'time',
    image: require('./assets/exercises/flutter-kicks.jpg'),
    video: require('./assets/videos/flutter-kicks.mp4')
  },
  reverse_crunches: {
    id: 'reverse_crunches',
    name: 'Reverse Crunches',
    type: 'reps',
    image: require('./assets/exercises/reverse-crunches.jpg'),
    video: require('./assets/videos/reverse-crunches.mp4')
  },
  side_plank_left: {
    id: 'side_plank_left',
    name: 'Side Plank Left',
    type: 'time',
    image: require('./assets/exercises/side-plank-left.jpg'),
    video: require('./assets/videos/side-plank-left.mp4')
  },
  side_plank_right: {
    id: 'side_plank_right',
    name: 'Side Plank Right',
    type: 'time',
    image: require('./assets/exercises/side-plank-right.jpg'),
    video: require('./assets/videos/side-plank-right.mp4')
  },
  v_up: {
    id: 'v_up',
    name: 'V-up',
    type: 'reps',
    image: require('./assets/exercises/v-up.jpg'),
    video: require('./assets/videos/v-up.mp4')
  },
  plank_jacks: {
    id: 'plank_jacks',
    name: 'Plank Jacks',
    type: 'time',
    image: require('./assets/exercises/plank-jacks.jpg'),
    video: require('./assets/videos/plank-jacks.mp4')
  },
  dead_bug: {
    id: 'dead_bug',
    name: 'Dead Bug',
    type: 'reps',
    image: require('./assets/exercises/dead-bug.jpg'),
    video: require('./assets/videos/dead-bug.mp4')
  },

  // --- UPPER BODY (PART 2) ---
  knee_push_ups: {
    id: 'knee_push_ups',
    name: 'Knee Push-ups',
    type: 'reps',
    image: require('./assets/exercises/knee-push-ups.jpg'),
    video: require('./assets/videos/knee-push-ups.mp4')
  },
  wide_arm_push_ups: {
    id: 'wide_arm_push_ups',
    name: 'Wide Arm Push-ups',
    type: 'reps',
    image: require('./assets/exercises/wide-arm-push-ups.jpg'),
    video: require('./assets/videos/wide-arm-push-ups.mp4')
  },
  incline_push_ups: {
    id: 'incline_push_ups',
    name: 'Incline Push-ups',
    type: 'reps',
    image: require('./assets/exercises/incline-push-ups.jpg'),
    video: require('./assets/videos/incline-push-ups.mp4')
  },
  decline_push_ups: {
    id: 'decline_push_ups',
    name: 'Decline Push-ups',
    type: 'reps',
    image: require('./assets/exercises/decline-push-ups.jpg'),
    video: require('./assets/videos/decline-push-ups.mp4')
  },
  box_push_ups: {
    id: 'box_push_ups',
    name: 'Box Push-ups',
    type: 'reps',
    image: require('./assets/exercises/box-push-ups.jpg'),
    video: require('./assets/videos/box-push-ups.mp4')
  },
  hindu_push_ups: {
    id: 'hindu_push_ups',
    name: 'Hindu Push-ups',
    type: 'reps',
    image: require('./assets/exercises/hindu-push-ups.jpg'),
    video: require('./assets/videos/hindu-push-ups.mp4')
  },
  tricep_extension_floor: {
    id: 'tricep_extension_floor',
    name: 'Tricep Extension Floor',
    type: 'reps',
    image: require('./assets/exercises/tricep-extension-floor.jpg'),
    video: require('./assets/videos/tricep-extension-floor.mp4')
  },
  punches: {
    id: 'punches',
    name: 'Punches',
    type: 'time',
    image: require('./assets/exercises/punches.jpg'),
    video: require('./assets/videos/punches.mp4')
  },
  reverse_snow_angels: {
    id: 'reverse_snow_angels',
    name: 'Reverse Snow Angels',
    type: 'reps',
    image: require('./assets/exercises/reverse-snow-angels.jpg'),
    video: require('./assets/videos/reverse-snow-angels.mp4')
  },

  // --- LEGS & GLUTES (PART 2) ---
  reverse_lunges: {
    id: 'reverse_lunges',
    name: 'Reverse Lunges',
    type: 'reps',
    image: require('./assets/exercises/reverse-lunges.jpg'),
    video: require('./assets/videos/reverse-lunges.mp4')
  },
  sumo_squat: {
    id: 'sumo_squat',
    name: 'Sumo Squat',
    type: 'reps',
    image: require('./assets/exercises/sumo-squat.jpg'),
    video: require('./assets/videos/sumo-squat.mp4')
  },
  donkey_kicks_left: {
    id: 'donkey_kicks_left',
    name: 'Donkey Kicks Left',
    type: 'reps',
    image: require('./assets/exercises/donkey-kicks-left.jpg'),
    video: require('./assets/videos/donkey-kicks-left.mp4')
  },
  donkey_kicks_right: {
    id: 'donkey_kicks_right',
    name: 'Donkey Kicks Right',
    type: 'reps',
    image: require('./assets/exercises/donkey-kicks-right.jpg'),
    video: require('./assets/videos/donkey-kicks-right.mp4')
  },
  side_leg_raise_left: {
    id: 'side_leg_raise_left',
    name: 'Side Leg Raise Left',
    type: 'reps',
    image: require('./assets/exercises/side-leg-raise-left.jpg'),
    video: require('./assets/videos/side-leg-raise-left.mp4')
  },
  side_leg_raise_right: {
    id: 'side_leg_raise_right',
    name: 'Side Leg Raise Right',
    type: 'reps',
    image: require('./assets/exercises/side-leg-raise-right.jpg'),
    video: require('./assets/videos/side-leg-raise-right.mp4')
  },

  // --- CARDIO & STRETCH (PART 2) ---
  rope_skipping: {
    id: 'rope_skipping',
    name: 'Rope Skipping',
    type: 'time',
    image: require('./assets/exercises/rope-skipping.jpg'),
    video: require('./assets/videos/rope-skipping.mp4')
  },
  torso_twist: {
    id: 'torso_twist',
    name: 'Torso Twist',
    type: 'time',
    image: require('./assets/exercises/torso-twist.jpg'),
    video: require('./assets/videos/torso-twist.mp4')
  },
  cobra_stretch: {
    id: 'cobra_stretch',
    name: 'Cobra Stretch',
    type: 'time',
    image: require('./assets/exercises/cobra-stretch.jpg'),
    video: require('./assets/videos/cobra-stretch.mp4')
  },
  childs_pose: {
    id: 'childs_pose',
    name: 'Child\'s Pose',
    type: 'time',
    image: require('./assets/exercises/childs-pose.jpg'),
    video: require('./assets/videos/childs-pose.mp4')
  },
  quad_stretch: {
    id: 'quad_stretch',
    name: 'Quad Stretch',
    type: 'time',
    image: require('./assets/exercises/quad-stretch.jpg'),
    video: require('./assets/videos/quad-stretch.mp4')
  },
  chest_stretch: {
    id: 'chest_stretch',
    name: 'Chest Stretch',
    type: 'time',
    image: require('./assets/exercises/chest-stretch.jpg'),
    video: require('./assets/videos/chest-stretch.mp4')
  },
  butterfly_stretch: {
    id: 'butterfly_stretch',
    name: 'Butterfly Stretch',
    type: 'time',
    image: require('./assets/exercises/butterfly-stretch.jpg'),
    video: require('./assets/videos/butterfly-stretch.mp4')
  },

  // --- SPECIAL ---
  rest: {
    id: 'rest',
    name: 'Rest & Recovery',
    type: 'time',
    image: require('./assets/exercises/rest-recovery.jpg'),
    video: require('./assets/videos/rest-recovery.mp4')
  }
};


// ======================================================
// 2. خطة الـ 28 يوم (THE 4-WEEK SHRED PLAN)
// ======================================================
export const WORKOUT_PLAN = {
  
  // ================= WEEK 1: IGNITION =================
  1: {
    dayId: 1,
    title: 'Full Body Start',
    subtitle: 'Week 1 • Day 1',
    duration: '24 Mins',
    level: 'Beginner',
    exercises: [
      { id: 'hip_circles', duration: '30s', durationSec: 30 },
      { id: 'jumping_jacks', duration: '30s', durationSec: 30 },
      { id: 'squats', duration: '12 reps', durationSec: 0 },
      { id: 'push_ups', duration: '10 reps', durationSec: 0 },
      { id: 'plank', duration: '30s', durationSec: 30 },
      { id: 'lunges', duration: '10 reps', durationSec: 0 },
      { id: 'jumping_jacks', duration: '30s', durationSec: 30 },
      { id: 'step_jacks', duration: '30s', durationSec: 30 },
      { id: 'wall_push_ups', duration: '10 reps', durationSec: 0 },
      { id: 'knee_push_ups', duration: '10 reps', durationSec: 0 },
      { id: 'reverse_lunges', duration: '10 reps', durationSec: 0 },
      { id: 'hamstring_stretch', duration: '30s', durationSec: 30 },
      { id: 'childs_pose', duration: '30s', durationSec: 30 }
    ]
  },
  2: {
    dayId: 2,
    title: 'Core Foundation',
    subtitle: 'Week 1 • Day 2',
    duration: '24 Mins',
    level: 'Beginner',
    exercises: [
      { id: 'cat_cow_stretch', duration: '30s', durationSec: 30 },
      { id: 'high_knees', duration: '30s', durationSec: 30 },
      { id: 'crunches', duration: '15 reps', durationSec: 0 },
      { id: 'leg_raises', duration: '10 reps', durationSec: 0 },
      { id: 'plank', duration: '40s', durationSec: 40 },
      { id: 'superman', duration: '30s', durationSec: 30 },
      { id: 'heel_touch', duration: '16 reps', durationSec: 0 },
      { id: 'bird_dog', duration: '12 reps', durationSec: 0 },
      { id: 'dead_bug', duration: '12 reps', durationSec: 0 },
      { id: 'reverse_crunches', duration: '12 reps', durationSec: 0 },
      { id: 'downward_dog', duration: '30s', durationSec: 30 },
      { id: 'cobra_stretch', duration: '30s', durationSec: 30 }
    ]
  },
  3: {
    dayId: 3,
    title: 'Legs & Glutes',
    subtitle: 'Week 1 • Day 3',
    duration: '27 Mins',
    level: 'Beginner',
    exercises: [
      { id: 'knee_circles', duration: '30s', durationSec: 30 },
      { id: 'squats', duration: '15 reps', durationSec: 0 },
      { id: 'lunges', duration: '12 reps', durationSec: 0 },
      { id: 'calf_raises', duration: '15 reps', durationSec: 0 },
      { id: 'glute_bridges', duration: '15 reps', durationSec: 0 },
      { id: 'wall_sit', duration: '30s', durationSec: 30 },
      { id: 'fire_hydrant_left', duration: '12 reps', durationSec: 0 },
      { id: 'fire_hydrant_right', duration: '12 reps', durationSec: 0 },
      { id: 'single_leg_glute_bridge', duration: '10 reps', durationSec: 0 },
      { id: 'sumo_squat', duration: '15 reps', durationSec: 0 },
      { id: 'donkey_kicks_left', duration: '12 reps', durationSec: 0 },
      { id: 'donkey_kicks_right', duration: '12 reps', durationSec: 0 },
      { id: 'hip_flexor_stretch', duration: '30s', durationSec: 30 },
      { id: 'quad_stretch', duration: '30s', durationSec: 30 }
    ]
  },
  4: {
    dayId: 4,
    title: 'Active Recovery',
    subtitle: 'Week 1 • Day 4',
    duration: '18 Mins',
    level: 'Easy',
    exercises: [
      { id: 'torso_twist', duration: '30s', durationSec: 30 },
      { id: 'neck_rolls', duration: '30s', durationSec: 30 },
      { id: 'shoulder_rolls', duration: '30s', durationSec: 30 },
      { id: 'jumping_jacks', duration: '30s', durationSec: 30 },
      { id: 'arm_circles', duration: '30s', durationSec: 30 },
      { id: 'superman', duration: '30s', durationSec: 30 },
      { id: 'plank', duration: '30s', durationSec: 30 },
      { id: 'cat_cow_stretch', duration: '30s', durationSec: 30 },
      { id: 'downward_dog', duration: '30s', durationSec: 30 },
      { id: 'hamstring_stretch', duration: '30s', durationSec: 30 },
      { id: 'childs_pose', duration: '30s', durationSec: 30 },
      { id: 'butterfly_stretch', duration: '30s', durationSec: 30 }
    ]
  },
  5: {
    dayId: 5,
    title: 'Upper Body Strength',
    subtitle: 'Week 1 • Day 5',
    duration: '24 Mins',
    level: 'Beginner',
    exercises: [
      { id: 'shoulder_rolls', duration: '30s', durationSec: 30 },
      { id: 'push_ups', duration: '10 reps', durationSec: 0 },
      { id: 'tricep_dips', duration: '10 reps', durationSec: 0 },
      { id: 'pike_push_ups', duration: '8 reps', durationSec: 0 },
      { id: 'plank', duration: '40s', durationSec: 40 },
      { id: 'mountain_climbers', duration: '30s', durationSec: 30 },
      { id: 'shoulder_taps', duration: '16 reps', durationSec: 0 },
      { id: 'arm_scissors', duration: '30s', durationSec: 30 },
      { id: 'box_push_ups', duration: '10 reps', durationSec: 0 },
      { id: 'incline_push_ups', duration: '10 reps', durationSec: 0 },
      { id: 'downward_dog', duration: '30s', durationSec: 30 },
      { id: 'chest_stretch', duration: '30s', durationSec: 30 }
    ]
  },
  6: {
    dayId: 6,
    title: 'HIIT Cardio',
    subtitle: 'Week 1 • Day 6',
    duration: '29 Mins',
    level: 'Intermediate',
    exercises: [
      { id: 'ankle_circles', duration: '30s', durationSec: 30 },
      { id: 'jumping_jacks', duration: '40s', durationSec: 40 },
      { id: 'burpees', duration: '8 reps', durationSec: 0 },
      { id: 'mountain_climbers', duration: '40s', durationSec: 40 },
      { id: 'high_knees', duration: '40s', durationSec: 40 },
      { id: 'plank', duration: '45s', durationSec: 45 },
      { id: 'seal_jacks', duration: '40s', durationSec: 40 },
      { id: 'half_burpees', duration: '10 reps', durationSec: 0 },
      { id: 'fast_feet', duration: '30s', durationSec: 30 },
      { id: 'rope_skipping', duration: '40s', durationSec: 40 },
      { id: 'punches', duration: '30s', durationSec: 30 },
      { id: 'hamstring_stretch', duration: '30s', durationSec: 30 }
    ]
  },
  7: {
    dayId: 7,
    title: 'Rest Day',
    subtitle: 'Week 1 • Day 7',
    duration: '0 Mins',
    level: '-',
    exercises: [
        { id: 'rest', duration: 'Relax & Recover', durationSec: 10 }
    ]
  },

  // ================= WEEK 2: TORCH =================
  8: {
    dayId: 8,
    title: 'Full Body Burn',
    subtitle: 'Week 2 • Day 1',
    duration: '29 Mins',
    level: 'Intermediate',
    exercises: [
      { id: 'inchworms', duration: '6 reps', durationSec: 0 },
      { id: 'jumping_jacks', duration: '45s', durationSec: 45 },
      { id: 'squats', duration: '20 reps', durationSec: 0 },
      { id: 'push_ups', duration: '15 reps', durationSec: 0 },
      { id: 'plank', duration: '50s', durationSec: 50 },
      { id: 'lunges', duration: '16 reps', durationSec: 0 },
      { id: 'squat_jumps', duration: '12 reps', durationSec: 0 },
      { id: 'plank_up_downs', duration: '10 reps', durationSec: 0 },
      { id: 'wide_arm_push_ups', duration: '12 reps', durationSec: 0 },
      { id: 'reverse_lunges', duration: '16 reps', durationSec: 0 },
      { id: 'hip_flexor_stretch', duration: '30s', durationSec: 30 },
      { id: 'quad_stretch', duration: '30s', durationSec: 30 }
    ]
  },
  9: {
    dayId: 9,
    title: 'Abs Attack',
    subtitle: 'Week 2 • Day 2',
    duration: '29 Mins',
    level: 'Intermediate',
    exercises: [
      { id: 'cat_cow_stretch', duration: '30s', durationSec: 30 },
      { id: 'crunches', duration: '20 reps', durationSec: 0 },
      { id: 'leg_raises', duration: '15 reps', durationSec: 0 },
      { id: 'russian_twists', duration: '20 reps', durationSec: 0 },
      { id: 'bicycle_crunches', duration: '40s', durationSec: 40 },
      { id: 'plank', duration: '60s', durationSec: 60 },
      { id: 'ab_pulse', duration: '30s', durationSec: 30 },
      { id: 'toe_touch_crunches', duration: '16 reps', durationSec: 0 },
      { id: 'hollow_body_hold', duration: '20s', durationSec: 20 },
      { id: 'sit_ups', duration: '15 reps', durationSec: 0 },
      { id: 'flutter_kicks', duration: '30s', durationSec: 30 },
      { id: 'side_plank_left', duration: '20s', durationSec: 20 },
      { id: 'side_plank_right', duration: '20s', durationSec: 20 },
      { id: 'downward_dog', duration: '30s', durationSec: 30 },
      { id: 'cobra_stretch', duration: '30s', durationSec: 30 }
    ]
  },
  10: {
    dayId: 10,
    title: 'Lower Body Power',
    subtitle: 'Week 2 • Day 3',
    duration: '31 Mins',
    level: 'Intermediate',
    exercises: [
      { id: 'hip_circles', duration: '30s', durationSec: 30 },
      { id: 'squats', duration: '25 reps', durationSec: 0 },
      { id: 'side_lunges', duration: '16 reps', durationSec: 0 },
      { id: 'glute_bridges', duration: '20 reps', durationSec: 0 },
      { id: 'wall_sit', duration: '45s', durationSec: 45 },
      { id: 'calf_raises', duration: '20 reps', durationSec: 0 },
      { id: 'curtsy_lunges', duration: '16 reps', durationSec: 0 },
      { id: 'step_ups', duration: '16 reps', durationSec: 0 },
      { id: 'pulsing_squats', duration: '30s', durationSec: 30 },
      { id: 'side_leg_raise_left', duration: '15 reps', durationSec: 0 },
      { id: 'side_leg_raise_right', duration: '15 reps', durationSec: 0 },
      { id: 'sumo_squat', duration: '20 reps', durationSec: 0 },
      { id: 'hip_flexor_stretch', duration: '30s', durationSec: 30 },
      { id: 'butterfly_stretch', duration: '30s', durationSec: 30 }
    ]
  },
  11: {
    dayId: 11,
    title: 'Cardio Intervals',
    subtitle: 'Week 2 • Day 4',
    duration: '24 Mins',
    level: 'Intermediate',
    exercises: [
      { id: 'ankle_circles', duration: '30s', durationSec: 30 },
      { id: 'jumping_jacks', duration: '50s', durationSec: 50 },
      { id: 'high_knees', duration: '40s', durationSec: 40 },
      { id: 'butt_kicks', duration: '40s', durationSec: 40 },
      { id: 'mountain_climbers', duration: '30s', durationSec: 30 },
      { id: 'spot_running', duration: '40s', durationSec: 40 },
      { id: 'lateral_shuffle', duration: '30s', durationSec: 30 },
      { id: 'skater_jumps', duration: '30s', durationSec: 30 },
      { id: 'plank_jacks', duration: '30s', durationSec: 30 },
      { id: 'rope_skipping', duration: '45s', durationSec: 45 },
      { id: 'hamstring_stretch', duration: '30s', durationSec: 30 }
    ]
  },
  12: {
    dayId: 12,
    title: 'Upper Body Pump',
    subtitle: 'Week 2 • Day 5',
    duration: '29 Mins',
    level: 'Intermediate',
    exercises: [
      { id: 'shoulder_rolls', duration: '30s', durationSec: 30 },
      { id: 'push_ups', duration: '15 reps', durationSec: 0 },
      { id: 'diamond_push_ups', duration: '8 reps', durationSec: 0 },
      { id: 'tricep_dips', duration: '15 reps', durationSec: 0 },
      { id: 'pike_push_ups', duration: '10 reps', durationSec: 0 },
      { id: 'plank', duration: '60s', durationSec: 60 },
      { id: 'push_up_and_rotation', duration: '10 reps', durationSec: 0 },
      { id: 'cobra_push_ups', duration: '10 reps', durationSec: 0 },
      { id: 'bear_crawl', duration: '30s', durationSec: 30 },
      { id: 'tricep_extension_floor', duration: '12 reps', durationSec: 0 },
      { id: 'reverse_snow_angels', duration: '12 reps', durationSec: 0 },
      { id: 'downward_dog', duration: '30s', durationSec: 30 },
      { id: 'chest_stretch', duration: '30s', durationSec: 30 }
    ]
  },
  13: {
    dayId: 13,
    title: 'HIIT Challenge',
    subtitle: 'Week 2 • Day 6',
    duration: '34 Mins',
    level: 'Hard',
    exercises: [
      { id: 'inchworms', duration: '8 reps', durationSec: 0 },
      { id: 'burpees', duration: '10 reps', durationSec: 0 },
      { id: 'mountain_climbers', duration: '50s', durationSec: 50 },
      { id: 'jumping_jacks', duration: '60s', durationSec: 60 },
      { id: 'high_knees', duration: '50s', durationSec: 50 },
      { id: 'squats', duration: '25 reps', durationSec: 0 },
      { id: 'cross_mountain_climbers', duration: '40s', durationSec: 40 },
      { id: 'tuck_jumps', duration: '10 reps', durationSec: 0 },
      { id: 'lunge_jumps', duration: '12 reps', durationSec: 0 },
      { id: 'punches', duration: '45s', durationSec: 45 },
      { id: 'plank_jacks', duration: '40s', durationSec: 40 },
      { id: 'hamstring_stretch', duration: '30s', durationSec: 30 }
    ]
  },
  14: {
    dayId: 14,
    title: 'Rest Day',
    subtitle: 'Week 2 • Day 7',
    duration: '0 Mins',
    level: '-',
    exercises: [{ id: 'rest', duration: 'Recover', durationSec: 10 }]
  },

  // ================= WEEK 3 =================
  15: {
    dayId: 15,
    title: 'Full Body Sculpt',
    subtitle: 'Week 3 • Day 1',
    duration: '34 Mins',
    level: 'Hard',
    exercises: [
      { id: 'inchworms', duration: '8 reps', durationSec: 0 },
      { id: 'jumping_jacks', duration: '60s', durationSec: 60 },
      { id: 'squats', duration: '30 reps', durationSec: 0 },
      { id: 'push_ups', duration: '20 reps', durationSec: 0 },
      { id: 'lunges', duration: '20 reps', durationSec: 0 },
      { id: 'plank', duration: '75s', durationSec: 75 },
      { id: 'bulgarian_split_squats', duration: '20 reps', durationSec: 0 },
      { id: 'plank_up_downs', duration: '14 reps', durationSec: 0 },
      { id: 'hindu_push_ups', duration: '10 reps', durationSec: 0 },
      { id: 'reverse_lunges', duration: '20 reps', durationSec: 0 },
      { id: 'hip_flexor_stretch', duration: '40s', durationSec: 40 },
      { id: 'childs_pose', duration: '40s', durationSec: 40 }
    ]
  },
  16: {
    dayId: 16,
    title: 'Core Shred',
    subtitle: 'Week 3 • Day 2',
    duration: '31 Mins',
    level: 'Hard',
    exercises: [
      { id: 'cat_cow_stretch', duration: '40s', durationSec: 40 },
      { id: 'leg_raises', duration: '20 reps', durationSec: 0 },
      { id: 'bicycle_crunches', duration: '50s', durationSec: 50 },
      { id: 'russian_twists', duration: '30 reps', durationSec: 0 },
      { id: 'mountain_climbers', duration: '50s', durationSec: 50 },
      { id: 'plank', duration: '90s', durationSec: 90 },
      { id: 'scissor_kicks', duration: '40s', durationSec: 40 },
      { id: 'windshield_wipers', duration: '12 reps', durationSec: 0 },
      { id: 'hollow_body_hold', duration: '30s', durationSec: 30 },
      { id: 'v_up', duration: '12 reps', durationSec: 0 },
      { id: 'dead_bug', duration: '16 reps', durationSec: 0 },
      { id: 'side_plank_left', duration: '30s', durationSec: 30 },
      { id: 'side_plank_right', duration: '30s', durationSec: 30 },
      { id: 'downward_dog', duration: '40s', durationSec: 40 },
      { id: 'cobra_stretch', duration: '40s', durationSec: 40 }
    ]
  },
  17: {
    dayId: 17,
    title: 'Legs Intensity',
    subtitle: 'Week 3 • Day 3',
    duration: '34 Mins',
    level: 'Hard',
    exercises: [
      { id: 'knee_circles', duration: '40s', durationSec: 40 },
      { id: 'squats', duration: '35 reps', durationSec: 0 },
      { id: 'lunges', duration: '24 reps', durationSec: 0 },
      { id: 'wall_sit', duration: '60s', durationSec: 60 },
      { id: 'side_lunges', duration: '20 reps', durationSec: 0 },
      { id: 'calf_raises', duration: '30 reps', durationSec: 0 },
      { id: 'single_leg_romanian_deadlift', duration: '20 reps', durationSec: 0 },
      { id: 'frog_jumps', duration: '12 reps', durationSec: 0 },
      { id: 'single_leg_glute_bridge', duration: '16 reps', durationSec: 0 },
      { id: 'donkey_kicks_left', duration: '16 reps', durationSec: 0 },
      { id: 'donkey_kicks_right', duration: '16 reps', durationSec: 0 },
      { id: 'side_leg_raise_left', duration: '20 reps', durationSec: 0 },
      { id: 'side_leg_raise_right', duration: '20 reps', durationSec: 0 },
      { id: 'hip_flexor_stretch', duration: '40s', durationSec: 40 },
      { id: 'quad_stretch', duration: '40s', durationSec: 40 }
    ]
  },
  18: {
    dayId: 18,
    title: 'Cardio Blast',
    subtitle: 'Week 3 • Day 4',
    duration: '29 Mins',
    level: 'Intermediate',
    exercises: [
      { id: 'ankle_circles', duration: '40s', durationSec: 40 },
      { id: 'high_knees', duration: '60s', durationSec: 60 },
      { id: 'butt_kicks', duration: '60s', durationSec: 60 },
      { id: 'jumping_jacks', duration: '60s', durationSec: 60 },
      { id: 'burpees', duration: '12 reps', durationSec: 0 },
      { id: 'seal_jacks', duration: '60s', durationSec: 60 },
      { id: 'skater_jumps', duration: '45s', durationSec: 45 },
      { id: 'fast_feet', duration: '45s', durationSec: 45 },
      { id: 'crab_walk', duration: '30s', durationSec: 30 },
      { id: 'rope_skipping', duration: '60s', durationSec: 60 },
      { id: 'punches', duration: '60s', durationSec: 60 },
      { id: 'hamstring_stretch', duration: '40s', durationSec: 40 }
    ]
  },
  19: {
    dayId: 19,
    title: 'Upper Body Power',
    subtitle: 'Week 3 • Day 5',
    duration: '34 Mins',
    level: 'Hard',
    exercises: [
      { id: 'shoulder_rolls', duration: '40s', durationSec: 40 },
      { id: 'push_ups', duration: '20 reps', durationSec: 0 },
      { id: 'tricep_dips', duration: '20 reps', durationSec: 0 },
      { id: 'diamond_push_ups', duration: '12 reps', durationSec: 0 },
      { id: 'pike_push_ups', duration: '12 reps', durationSec: 0 },
      { id: 'superman', duration: '50s', durationSec: 50 },
      { id: 'archer_push_ups', duration: '10 reps', durationSec: 0 },
      { id: 'shoulder_taps', duration: '24 reps', durationSec: 0 },
      { id: 'push_up_and_rotation', duration: '14 reps', durationSec: 0 },
      { id: 'decline_push_ups', duration: '12 reps', durationSec: 0 },
      { id: 'tricep_extension_floor', duration: '15 reps', durationSec: 0 },
      { id: 'reverse_snow_angels', duration: '15 reps', durationSec: 0 },
      { id: 'downward_dog', duration: '40s', durationSec: 40 },
      { id: 'chest_stretch', duration: '40s', durationSec: 40 }
    ]
  },
  20: {
    dayId: 20,
    title: 'HIIT Extreme',
    subtitle: 'Week 3 • Day 6',
    duration: '39 Mins',
    level: 'Expert',
    exercises: [
      { id: 'inchworms', duration: '10 reps', durationSec: 0 },
      { id: 'burpees', duration: '15 reps', durationSec: 0 },
      { id: 'mountain_climbers', duration: '60s', durationSec: 60 },
      { id: 'high_knees', duration: '60s', durationSec: 60 },
      { id: 'squats', duration: '35 reps', durationSec: 0 },
      { id: 'push_ups', duration: '20 reps', durationSec: 0 },
      { id: 'tuck_jumps', duration: '15 reps', durationSec: 0 },
      { id: 'cross_mountain_climbers', duration: '60s', durationSec: 60 },
      { id: 'lunge_jumps', duration: '20 reps', durationSec: 0 },
      { id: 'plank_jacks', duration: '50s', durationSec: 50 },
      { id: 'hamstring_stretch', duration: '40s', durationSec: 40 }
    ]
  },
  21: {
    dayId: 21,
    title: 'Rest Day',
    subtitle: 'Week 3 • Day 7',
    duration: '0 Mins',
    level: '-',
    exercises: [{ id: 'rest', duration: 'Recover', durationSec: 10 }]
  },

  // ================= WEEK 4 =================
  22: {
    dayId: 22,
    title: 'The Ultimate Burn',
    subtitle: 'Week 4 • Day 1',
    duration: '39 Mins',
    level: 'Expert',
    exercises: [
      { id: 'hip_circles', duration: '45s', durationSec: 45 },
      { id: 'burpees', duration: '15 reps', durationSec: 0 },
      { id: 'push_ups', duration: '25 reps', durationSec: 0 },
      { id: 'squats', duration: '40 reps', durationSec: 0 },
      { id: 'plank', duration: '90s', durationSec: 90 },
      { id: 'mountain_climbers', duration: '60s', durationSec: 60 },
      { id: 'squat_jumps', duration: '20 reps', durationSec: 0 },
      { id: 'plank_up_downs', duration: '16 reps', durationSec: 0 },
      { id: 'bear_crawl', duration: '45s', durationSec: 45 },
      { id: 'decline_push_ups', duration: '15 reps', durationSec: 0 },
      { id: 'sumo_squat', duration: '30 reps', durationSec: 0 },
      { id: 'hip_flexor_stretch', duration: '45s', durationSec: 45 },
      { id: 'childs_pose', duration: '45s', durationSec: 45 }
    ]
  },
  23: {
    dayId: 23,
    title: 'Core of Steel',
    subtitle: 'Week 4 • Day 2',
    duration: '34 Mins',
    level: 'Expert',
    exercises: [
      { id: 'cat_cow_stretch', duration: '45s', durationSec: 45 },
      { id: 'bicycle_crunches', duration: '60s', durationSec: 60 },
      { id: 'leg_raises', duration: '25 reps', durationSec: 0 },
      { id: 'russian_twists', duration: '40 reps', durationSec: 0 },
      { id: 'plank', duration: '120s', durationSec: 120 },
      { id: 'mountain_climbers', duration: '60s', durationSec: 60 },
      { id: 'hollow_body_hold', duration: '45s', durationSec: 45 },
      { id: 'windshield_wipers', duration: '16 reps', durationSec: 0 },
      { id: 'heel_touch', duration: '30 reps', durationSec: 0 },
      { id: 'high_plank', duration: '60s', durationSec: 60 },
      { id: 'v_up', duration: '16 reps', durationSec: 0 },
      { id: 'flutter_kicks', duration: '45s', durationSec: 45 },
      { id: 'reverse_crunches', duration: '20 reps', durationSec: 0 },
      { id: 'sit_ups', duration: '25 reps', durationSec: 0 },
      { id: 'downward_dog', duration: '45s', durationSec: 45 },
      { id: 'cobra_stretch', duration: '45s', durationSec: 45 }
    ]
  },
  24: {
    dayId: 24,
    title: 'Legs Destruction',
    subtitle: 'Week 4 • Day 3',
    duration: '39 Mins',
    level: 'Expert',
    exercises: [
      { id: 'knee_circles', duration: '45s', durationSec: 45 },
      { id: 'squats', duration: '50 reps', durationSec: 0 },
      { id: 'lunges', duration: '30 reps', durationSec: 0 },
      { id: 'wall_sit', duration: '90s', durationSec: 90 },
      { id: 'calf_raises', duration: '40 reps', durationSec: 0 },
      { id: 'side_lunges', duration: '24 reps', durationSec: 0 },
      { id: 'bulgarian_split_squats', duration: '24 reps', durationSec: 0 },
      { id: 'curtsy_lunges', duration: '24 reps', durationSec: 0 },
      { id: 'pulsing_squats', duration: '60s', durationSec: 60 },
      { id: 'frog_jumps', duration: '15 reps', durationSec: 0 },
      { id: 'reverse_lunges', duration: '30 reps', durationSec: 0 },
      { id: 'donkey_kicks_left', duration: '20 reps', durationSec: 0 },
      { id: 'donkey_kicks_right', duration: '20 reps', durationSec: 0 },
      { id: 'side_leg_raise_left', duration: '24 reps', durationSec: 0 },
      { id: 'side_leg_raise_right', duration: '24 reps', durationSec: 0 },
      { id: 'hip_flexor_stretch', duration: '45s', durationSec: 45 },
      { id: 'quad_stretch', duration: '45s', durationSec: 45 },
      { id: 'butterfly_stretch', duration: '45s', durationSec: 45 }
    ]
  },
  25: {
    dayId: 25,
    title: 'Active Recovery',
    subtitle: 'Week 4 • Day 4',
    duration: '23 Mins',
    level: 'Easy',
    exercises: [
      { id: 'torso_twist', duration: '45s', durationSec: 45 },
      { id: 'neck_rolls', duration: '45s', durationSec: 45 },
      { id: 'shoulder_rolls', duration: '45s', durationSec: 45 },
      { id: 'jumping_jacks', duration: '45s', durationSec: 45 },
      { id: 'arm_circles', duration: '45s', durationSec: 45 },
      { id: 'superman', duration: '45s', durationSec: 45 },
      { id: 'plank', duration: '45s', durationSec: 45 },
      { id: 'cat_cow_stretch', duration: '45s', durationSec: 45 },
      { id: 'standing_toe_touch', duration: '10 reps', durationSec: 0 },
      { id: 'downward_dog', duration: '45s', durationSec: 45 },
      { id: 'hamstring_stretch', duration: '45s', durationSec: 45 },
      { id: 'hip_flexor_stretch', duration: '45s', durationSec: 45 },
      { id: 'childs_pose', duration: '45s', durationSec: 45 },
      { id: 'cobra_stretch', duration: '45s', durationSec: 45 },
      { id: 'quad_stretch', duration: '45s', durationSec: 45 },
      { id: 'chest_stretch', duration: '45s', durationSec: 45 },
      { id: 'butterfly_stretch', duration: '45s', durationSec: 45 }
    ]
  },
  26: {
    dayId: 26,
    title: 'Upper Body Beast',
    subtitle: 'Week 4 • Day 5',
    duration: '34 Mins',
    level: 'Expert',
    exercises: [
      { id: 'shoulder_rolls', duration: '45s', durationSec: 45 },
      { id: 'push_ups', duration: '30 reps', durationSec: 0 },
      { id: 'diamond_push_ups', duration: '15 reps', durationSec: 0 },
      { id: 'pike_push_ups', duration: '15 reps', durationSec: 0 },
      { id: 'tricep_dips', duration: '25 reps', durationSec: 0 },
      { id: 'plank', duration: '90s', durationSec: 90 },
      { id: 'archer_push_ups', duration: '14 reps', durationSec: 0 },
      { id: 'cobra_push_ups', duration: '15 reps', durationSec: 0 },
      { id: 'arm_scissors', duration: '45s', durationSec: 45 },
      { id: 'hindu_push_ups', duration: '15 reps', durationSec: 0 },
      { id: 'wide_arm_push_ups', duration: '20 reps', durationSec: 0 },
      { id: 'tricep_extension_floor', duration: '20 reps', durationSec: 0 },
      { id: 'reverse_snow_angels', duration: '20 reps', durationSec: 0 },
      { id: 'downward_dog', duration: '45s', durationSec: 45 },
      { id: 'chest_stretch', duration: '45s', durationSec: 45 }
    ]
  },
  27: {
    dayId: 27,
    title: 'THE FINAL TEST',
    subtitle: 'Week 4 • Day 6',
    duration: '44 Mins',
    level: 'CHAMPION',
    exercises: [
      { id: 'inchworms', duration: '10 reps', durationSec: 0 },
      { id: 'burpees', duration: '20 reps', durationSec: 0 },
      { id: 'squats', duration: '50 reps', durationSec: 0 },
      { id: 'push_ups', duration: '30 reps', durationSec: 0 },
      { id: 'mountain_climbers', duration: '90s', durationSec: 90 },
      { id: 'plank', duration: '120s', durationSec: 120 },
      { id: 'high_knees', duration: '60s', durationSec: 60 },
      { id: 'tuck_jumps', duration: '15 reps', durationSec: 0 },
      { id: 'crab_walk', duration: '45s', durationSec: 45 },
      { id: 'cross_mountain_climbers', duration: '60s', durationSec: 60 },
      { id: 'v_up', duration: '15 reps', durationSec: 0 },
      { id: 'rope_skipping', duration: '60s', durationSec: 60 },
      { id: 'punches', duration: '60s', durationSec: 60 },
      { id: 'hamstring_stretch', duration: '45s', durationSec: 45 },
      { id: 'childs_pose', duration: '45s', durationSec: 45 }
    ]
  },
  28: {
    dayId: 28,
    title: 'Finish Line',
    subtitle: 'Week 4 • Day 7',
    duration: '0 Mins',
    level: 'Completed',
    exercises: [
      { id: 'rest', duration: 'YOU MADE IT! 🎉', durationSec: 10 }
    ]
  }
};

// =========================================================
// التعريب: بنحوّل الأسماء والعناوين للعربي مرة واحدة وقت تحميل الملف
// الأصل الإنجليزي محفوظ في nameEn / titleEn لو احتجته
// =========================================================
Object.values(EXERCISE_LIBRARY).forEach((ex) => {
  ex.nameEn = ex.name;
  if (AR_UI) ex.name = EXERCISE_NAMES_AR[ex.id] || ex.name;
});

Object.values(WORKOUT_PLAN).forEach((day) => {
  const week = Math.ceil(day.dayId / 7);
  const dayInWeek = ((day.dayId - 1) % 7) + 1;
  day.titleEn = day.title;
  day.levelEn = day.level;
  if (AR_UI) {
    day.title = DAY_TITLES_AR[day.title] || day.title;
    day.subtitle = `الأسبوع ${week} • اليوم ${dayInWeek}`;
    day.duration = durationAr(day.duration);
    day.level = LEVELS_AR[day.level] || day.level;
  } else {
    day.subtitle = `Week ${week} • Day ${dayInWeek}`;
  }
  day.isRest = day.exercises.length === 1 && day.exercises[0].id === 'rest';
  day.exercises.forEach((item) => {
    item.durationEn = item.duration;
    if (AR_UI) item.duration = durationAr(item.duration);
  });
});
