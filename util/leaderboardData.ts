import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceIdentifier } from './deviceIdentifier';
import { generateRandomName, generateSeededName } from './randomNames';

const API_BASE_URL = 'https://recyclingleaderboard-production.up.railway.app';
const LEADERBOARD_KEY = '@leaderboard_data';
const USER_SCORE_KEY = '@user_score';

export interface LeaderboardEntry {
  user_id: string;
  score: number;
  rank: number;
  last_updated: string;
  name?: string; // Derived from user_id using generateSeededName
  isCurrentUser?: boolean;
}

/**
 * Gets the current user's score
 */
export async function getUserScore(): Promise<number> {
  try {
    const scoreStr = await AsyncStorage.getItem(USER_SCORE_KEY);
    return scoreStr ? parseInt(scoreStr, 10) : 0;
  } catch (error) {
    console.error('Error getting user score:', error);
    return 0;
  }
}

/**
 * Updates the current user's score
 */
export async function updateUserScore(points: number): Promise<number> {
  try {
    const currentScore = await getUserScore();
    const newScore = currentScore + points;
    await AsyncStorage.setItem(USER_SCORE_KEY, newScore.toString());
    
    // Post to API
    const deviceId = await getDeviceIdentifier();
    const userName = generateSeededName(deviceId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard/${userName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score: newScore }),
      });
      
      if (!response.ok) {
        console.warn('Failed to update score on server:', response.status);
      }
    } catch (apiError) {
      console.error('Error posting score to API:', apiError);
      // Continue even if API fails - local score is still updated
    }
    
    return newScore;
  } catch (error) {
    console.error('Error updating user score:', error);
    return 0;
  }
}

/**
 * Generates mock leaderboard data with random scores
 */
function generateMockLeaderboard(count: number = 20): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  
  for (let i = 0; i < count; i++) {
    const id = `user_${i}`;
    entries.push({
      id,
      name: generateRandomName(),
      score: Math.floor(Math.random() * 10000) + 100,
    });
  }
  
  // Sort by score descending
  entries.sort((a, b) => b.score - a.score);
  
  return entries;
}

/**
 * Gets user information from the API
 */
export async function getUserInfo(userName: string): Promise<LeaderboardEntry | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard/${userName}`);
    if (response.ok) {
      const data = await response.json();
      return {
        ...data,
        name: data.user_id,
        isCurrentUser: true,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

/**
 * Gets the full leaderboard including the current user
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const deviceId = await getDeviceIdentifier();
    const userName = generateSeededName(deviceId);
    const userScore = await getUserScore();
    
    // Fetch top 10 from API
    let leaderboard: LeaderboardEntry[] = [];
    
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard/top/20`);
      if (response.ok) {
        const apiData = await response.json();
        leaderboard = apiData.map((entry: any) => ({
          ...entry,
          name: entry.user_id, // Use user_id as the display name (it's already the generated name)
          isCurrentUser: entry.user_id === userName,
        }));
      } else {
        console.warn('Failed to fetch leaderboard from API:', response.status);
        // Fall back to local mock data
        leaderboard = await getLocalLeaderboard(deviceId, userName, userScore);
      }
    } catch (apiError) {
      console.error('Error fetching leaderboard from API:', apiError);
      // Fall back to local mock data
      leaderboard = await getLocalLeaderboard(deviceId, userName, userScore);
    }
    
    // Ensure current user is in the leaderboard if they have a score
    if (userScore > 0) {
      const userInLeaderboard = leaderboard.some(entry => entry.user_id === userName);
      if (!userInLeaderboard) {
        // Add user to the leaderboard
        leaderboard.push({
          user_id: userName,
          name: userName,
          score: userScore,
          rank: leaderboard.length + 1,
          last_updated: new Date().toISOString(),
          isCurrentUser: true,
        });
        // Re-sort by score
        leaderboard.sort((a, b) => b.score - a.score);
        // Update ranks
        leaderboard.forEach((entry, index) => {
          entry.rank = index + 1;
        });
      }
    }
    
    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

/**
 * Gets local/mock leaderboard data (fallback when API is unavailable)
 */
async function getLocalLeaderboard(deviceId: string, userName: string, userScore: number): Promise<LeaderboardEntry[]> {
  let leaderboard: LeaderboardEntry[] = [];
  const storedData = await AsyncStorage.getItem(LEADERBOARD_KEY);
  
  if (storedData) {
    leaderboard = JSON.parse(storedData);
  } else {
    const mockData = generateMockLeaderboard();
    // Convert old format to new format
    leaderboard = mockData.map((entry, index) => ({
      user_id: entry.name || entry.id,
      name: entry.name || entry.id,
      score: entry.score,
      rank: index + 1,
      last_updated: new Date().toISOString(),
    }));
    await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  }
  
  // Remove any existing entry for current user
  leaderboard = leaderboard.filter(entry => entry.user_id !== userName && entry.user_id !== deviceId);
  
  // Add current user
  leaderboard.push({
    user_id: userName,
    name: userName,
    score: userScore,
    rank: 0,
    last_updated: new Date().toISOString(),
    isCurrentUser: true,
  });
  
  // Sort by score descending
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Update ranks
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return leaderboard;
}

/**
 * Refreshes the leaderboard with new mock data (useful for testing)
 */
export async function refreshLeaderboard(): Promise<void> {
  try {
    const newLeaderboard = generateMockLeaderboard();
    await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(newLeaderboard));
  } catch (error) {
    console.error('Error refreshing leaderboard:', error);
  }
}

/**
 * Resets the user's score
 */
export async function resetUserScore(): Promise<void> {
  try {
    await AsyncStorage.removeItem(USER_SCORE_KEY);
  } catch (error) {
    console.error('Error resetting user score:', error);
  }
}
