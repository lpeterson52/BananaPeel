// Random name generator using English words
const adjectives = [
  'Swift', 'Bright', 'Cool', 'Clever', 'Bold', 'Quick', 'Smart', 'Brave',
  'Happy', 'Lucky', 'Mighty', 'Noble', 'Wild', 'Wise', 'Calm', 'Fierce',
  'Gentle', 'Jolly', 'Keen', 'Lively', 'Merry', 'Proud', 'Radiant', 'Silent',
  'Steady', 'Speedy', 'Vibrant', 'Warm', 'Zealous', 'Agile', 'Daring', 'Epic',
  'Fleet', 'Grand', 'Hardy', 'Intrepid', 'Jovial', 'Kinetic', 'Luminous', 'Mystic'
];

const nouns = [
  'Panda', 'Tiger', 'Eagle', 'Falcon', 'Dolphin', 'Phoenix', 'Dragon', 'Wolf',
  'Bear', 'Hawk', 'Lion', 'Raven', 'Shark', 'Cobra', 'Fox', 'Owl',
  'Jaguar', 'Lynx', 'Otter', 'Panther', 'Raccoon', 'Seal', 'Turtle', 'Viper',
  'Whale', 'Zebra', 'Bison', 'Crane', 'Deer', 'Elk', 'Gazelle', 'Heron',
  'Ibis', 'Koala', 'Lemur', 'Moose', 'Newt', 'Orca', 'Puma', 'Rhino'
];

/**
 * Generates a random name by combining an adjective and a noun
 * @returns A random name string (e.g., "Swift Panda")
 */
export function generateRandomName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective} ${noun}`;
}

/**
 * Generates a seeded random name based on a string input
 * This ensures the same input always generates the same name
 * @param seed - A string to use as the seed
 * @returns A consistent random name for the given seed
 */
export function generateSeededName(seed: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use hash to select adjective and noun
  const adjectiveIndex = Math.abs(hash % adjectives.length);
  const nounIndex = Math.abs(Math.floor(hash / adjectives.length) % nouns.length);
  
  return `${adjectives[adjectiveIndex]} ${nouns[nounIndex]}`;
}
