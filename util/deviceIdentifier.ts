import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = '@device_identifier';

/**
 * Gets or creates a unique device identifier
 * This identifier is used to represent the current user anonymously
 */
export async function getDeviceIdentifier(): Promise<string> {
  try {
    // Check if we already have a stored identifier
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (deviceId) {
      return deviceId;
    }
    
    // Try to get a platform-specific identifier
    if (Platform.OS === 'ios') {
      deviceId = await Application.getIosIdForVendorAsync() || generateRandomId();
    } else if (Platform.OS === 'android') {
      deviceId = Application.androidId || generateRandomId();
    } else {
      // For web or other platforms
      deviceId = generateRandomId();
    }
    
    // Store the identifier for future use
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.error('Error getting device identifier:', error);
    // Fallback to a random ID
    return generateRandomId();
  }
}

/**
 * Generates a random unique identifier
 */
function generateRandomId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clears the stored device identifier (useful for testing)
 */
export async function clearDeviceIdentifier(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
  } catch (error) {
    console.error('Error clearing device identifier:', error);
  }
}
