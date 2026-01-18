import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useState, useRef } from 'react';
import { Platform, StyleSheet, Button, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  // const [facing, setFacing] = useState<CameraType>('back');
  let [flashEnabled, setFlash] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <ThemedView style={styles.container}>
        <ThemedText>We need your permission to show the camera</ThemedText>
        <Button onPress={requestPermission} title="grant permission" />
      </ThemedView>
      
    );
  }

  function toggleFlash() {
    setFlash(!flashEnabled);
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });

      console.log('photo uri', photo.uri);
      if (photo?.uri) {
        setImageUri(photo.uri);
        // Navigate to result screen and pass the uri as a query param
        router.push(`/result?uri=${encodeURIComponent(photo.uri)}`);
      }
    } catch (err) {
      console.error('takePicture error', err);
    }
  }
  const exitImageView = () => {
    setImageUri(null)
    // no modal state to update
  }

  const exitModal = () => {

  }
  

  return (
    <ThemedView style={styles.container}>
      {imageUri ? [
        <Image key={0} source={{ uri: imageUri }} style={{ flex: 1 }} />,
        <SafeAreaView key={1} style={styles.topButtonContainer}>
          <TouchableOpacity style={styles.button} onPress={exitImageView}>
            <MaterialIcons name='close' size={36} color='white'/>
          </TouchableOpacity>
        </SafeAreaView>
      ] : [
        <CameraView key={0} ref={cameraRef} style={styles.camera} facing={'back'} enableTorch={flashEnabled} />,
        <SafeAreaView key={1} style={styles.topButtonContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
            <MaterialIcons name={flashEnabled ? 'flash-on' : 'flash-off'} size={28} color="white" />
          </TouchableOpacity>
        </SafeAreaView>,
        <View key={2} style={styles.bottomButtonContainer}>
          <TouchableOpacity style={styles.shutterButton} onPress={takePicture}></TouchableOpacity>
        </View>
      ]}

      {/* <Modal animationType="slide" transparent={true}>
        <ThemedView style={styles.modalContent}>
          <ThemedView style={styles.titleContainer}>
            <TouchableOpacity onPress={exitModal}>
              <MaterialIcons name="close" color="#fff" size={22} />
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>

      </Modal> */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  topButtonContainer: {
    top: 0,
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 64,
  },
  button: {
    alignItems: 'center',
    padding: 8,
  },
  iconButton: {
    padding: 8,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  shutterButton: {
    width: 70,
    height: 70,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: '#fff'
  },
  modalContent: {
    height: '25%',
    width: '100%',
    backgroundColor: '#25292e',
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    position: 'absolute',
    bottom: 0,
  },
  titleContainer: {
    height: '16%',
    backgroundColor: '#464C55',
    borderTopRightRadius: 10,
    borderTopLeftRadius: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#fff',
    fontSize: 16,
  },
});
