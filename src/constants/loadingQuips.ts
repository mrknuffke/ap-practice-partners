export const LOADING_QUIPS = [
  "Take a quick stretch while I work!",
  "Grab a snack — this takes about 30 seconds.",
  "You've totally got this!",
  "Deep breath. Practice makes perfect.",
  "Stand up and shake it out. Seriously.",
  "Fun fact: retrieval practice boosts retention by up to 50%. Science!",
  "Hydrate! Your brain runs on water.",
  "Roll your shoulders back. There you go.",
  "One sec — crafting something just for you.",
  "AP exams reward preparation. You're doing it.",
  "Close your eyes for 10 seconds. Rest them.",
  "Breathe in… and out. You've got this.",
  "Did you know? Spaced repetition is the most effective study method.",
  "Quick hand stretch? Your future test-taking self will thank you.",
  "You showed up today. That already puts you ahead.",
  "Eyes up from the screen for a sec. Look at something far away.",
  "Every question you practice is one less surprise on exam day.",
  "Almost there — great things take a moment.",
];

export function getRandomQuip(): string {
  return LOADING_QUIPS[Math.floor(Math.random() * LOADING_QUIPS.length)];
}
