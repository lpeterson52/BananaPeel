import AsyncStorage from '@react-native-async-storage/async-storage';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const HISTORY_KEY = '@history_items';

export interface HistoryItem {
  id: string;
  thumbnailUri: string;
  originalUri: string;
  classification: string;
  confidence?: number;
  timestamp: number;
  className?: string;
}

/**
 * Create a thumbnail from an image URI
 * Resizes to max 200x200 and compresses to keep storage small
 */
export async function createThumbnail(imageUri: string): Promise<string> {
  try {
    const manipResult = await manipulateAsync(
      imageUri,
      [{ resize: { width: 200 } }],
      { compress: 0.6, format: SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    return imageUri; // Fallback to original if thumbnail creation fails
  }
}

/**
 * Save a new history item
 */
export async function saveHistoryItem(item: Omit<HistoryItem, 'id' | 'timestamp'>): Promise<void> {
  try {
    const history = await getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    
    history.unshift(newItem); // Add to beginning of array
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving history item:', error);
    throw error;
  }
}

/**
 * Get all history items, sorted by most recent first
 */
export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    
    const history: HistoryItem[] = JSON.parse(data);
    return history.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
}

/**
 * Delete a specific history item
 */
export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const history = await getHistory();
    const filtered = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting history item:', error);
    throw error;
  }
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
}

/**
 * Format a timestamp relative to now.
 * - < 60s => 'just now'
 * - < 60m => 'X minutes ago'
 * - < 24h => 'X hours ago'
 * - < 7d => 'X days ago'
 * - otherwise => locale date string
 */
export function formatRelativeTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60_000) {
    return 'just now';
  }

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  const days = Math.floor(diff / 86_400_000);
  if (days < 7) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}

/**
 * Get background color for classification type
 */
export function getClassificationColor(classification: string): string {
  switch (classification) {
    case 'recyclable':
      return '#4CAF50'; // Green
    case 'compostable':
      return '#8B4513'; // Brown
    case 'landfill':
      return '#757575'; // Gray
    case 'unknown':
    default:
      return '#9E9E9E'; // Light Gray
  }
}
