import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Button, TouchableOpacity, View, ActivityIndicator, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { InformationView, InformationSheetRef } from "@/components/information-modal";

import classifyImage from "../../util/roboflow";
import { saveHistoryItem, createThumbnail, ClassificationType } from '../../util/historyStorage';

function ResultSheetContent({
  imageUri,
  onLoaded,
}: {
  imageUri: string;
  onLoaded: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // same logic as result.tsx :contentReference[oaicite:2]{index=2}
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await classifyImage(imageUri);
        if (!cancelled) setResult(res);
        
        // Save to history after successful classification
        if (res?.predictions?.[0]) {
          try {
            const thumbnailUri = await createThumbnail(imageUri);
            const topPred = res.predictions[0];

            // For now, set classification as 'unknown' since logic is being worked on
            await saveHistoryItem({
              thumbnailUri,
              originalUri: imageUri,
              classification: "unknown" as ClassificationType,
              confidence: topPred.confidence ?? topPred.confidence_score,
              className: topPred.class,
            });
          } catch (saveError) {
            console.error("Failed to save to history:", saveError);
            // Don't block the UI if saving fails
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
          onLoaded(); // ✅ tell sheet to expand to half
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUri, onLoaded]);

  const topPrediction = result?.predictions?.[0] ?? null; // :contentReference[oaicite:3]{index=3}

  const formatConfidenceValue = (v: any) => {
    const n = Number((v ?? 0)) * 100; // :contentReference[oaicite:4]{index=4}
    return `${Number.isNaN(n) ? "0.0" : n.toFixed(1)}%`;
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Title row like Google Translate's "panel" feel */}
      <View style={styles.sheetTitleRow}>
        <ThemedText style={styles.sheetTitle}>Result</ThemedText>
      </View>

      <View style={styles.sheetCard}>
        {loading ? (
          <View style={styles.centerRow}>
            <ActivityIndicator size="large" />
            <ThemedText>Classifying...</ThemedText>
          </View>
        ) : error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText type="subtitle">Top Prediction</ThemedText>
            {topPrediction ? (
              <View style={styles.predictionRow}>
                <ThemedText style={styles.predClass}>{topPrediction.class}</ThemedText>
                <ThemedText>
                  {formatConfidenceValue(topPrediction.confidence ?? topPrediction.confidence_score)}
                </ThemedText>
              </View>
            ) : (
              <ThemedText>No detections.</ThemedText>
            )}

            {Array.isArray(result?.predictions) && result.predictions.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <ThemedText type="subtitle">All Detections</ThemedText>
                {result.predictions.map((p: any, i: number) => (
                  <View key={i} style={styles.predictionRow}>
                    <ThemedText>{p.class}</ThemedText>
                    <ThemedText>{formatConfidenceValue(p.confidence ?? p.confidence_score)}</ThemedText>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}


export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  // const [facing, setFacing] = useState<CameraType>('back');
  let [flashEnabled, setFlash] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  const sheetRef = useRef<InformationSheetRef>(null);
  

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

      // console.log('photo uri', photo.uri);
      if (photo?.uri) {
        setImageUri(photo.uri);
        // Navigate to result screen and pass the uri as a query param
        // router.push(`/result?uri=${encodeURIComponent(photo.uri)}`);
        setInfoVisible(true);
      }
    } catch (err) {
      console.error('takePicture error', err);
    }
  }

  const closeInfo = () => {
    setInfoVisible(false);
    setImageUri(null);
  };
  
  // const exitImageView = () => {
    
  // };
  

  return (
    <ThemedView style={styles.container}>
      {imageUri ? [
        <Image key={0} source={{ uri: imageUri }} style={{ flex: 1 }} />,

        // <SafeAreaView key={1} style={styles.topButtonContainer}>
        //   <TouchableOpacity style={styles.button} onPress={exitImageView}>
        //     <MaterialIcons name='close' size={36} color='white'/>
        //   </TouchableOpacity>
        // </SafeAreaView>,

        <InformationView key={1}
          ref={sheetRef}
          isVisible={infoVisible}
          onClose={closeInfo}
          initialSnap="mini"
          closeOnBackdropPress={false}
        >
          <ResultSheetContent
            imageUri={imageUri}
            onLoaded={() => sheetRef.current?.snapTo("half")}
          />
        </InformationView>
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

  sheetTitleRow: {
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  sheetTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  sheetCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  predictionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  predClass: { fontWeight: "600" },
  error: { color: "red" },
});
