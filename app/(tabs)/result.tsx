import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, ScrollView, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import classifyImage from '../../util/roboflow';
import { saveHistoryItem, createThumbnail, ClassificationType } from '../../util/historyStorage';

export default function ResultScreen() {
  const params = useLocalSearchParams<{ uri?: string }>();
  const imageUri = typeof params?.uri === 'string' ? params.uri : undefined;

  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!imageUri) {
      setError('No image provided');
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    // reset UI for each new image and show loading
    setLoading(true);
    setResult(null);
    setError(null);

    (async () => {
      try {
        const res = await classifyImage(imageUri);
        if (!mounted) return;
        setResult(res);
        
        // Save to history after successful classification
        if (res?.predictions?.[0]) {
          try {
            const thumbnailUri = await createThumbnail(imageUri);
            const topPred = res.predictions[0];
            
            // For now, set classification as 'unknown' since logic is being worked on
            await saveHistoryItem({
              thumbnailUri,
              originalUri: imageUri,
              classification: 'unknown' as ClassificationType,
              confidence: topPred.confidence ?? topPred.confidence_score,
              className: topPred.class,
            });
          } catch (saveError) {
            console.error('Failed to save to history:', saveError);
            // Don't block the UI if saving fails
          }
        }
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message ?? String(err));
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [imageUri]);

  const topPrediction = result?.predictions?.[0] ?? null;

  const formatConfidenceValue = (v: any) => {
    const n = Number((v ?? 0)) * 100;
    return `${Number.isNaN(n) ? '0.0' : n.toFixed(1)}%`;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Result</ThemedText>

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <ThemedText>No image provided.</ThemedText>
        )}

        <View style={styles.card}>
          {loading ? (
            <View style={styles.centerRow}>
              <ActivityIndicator size="large" />
              <ThemedText>Classifying...</ThemedText>
            </View>
          ) : error ? (
            <ThemedText style={styles.error}>{error}</ThemedText>
          ) : (
            <ScrollView>
              <ThemedText type="subtitle">Top Prediction</ThemedText>
              {topPrediction ? (
                <View style={styles.predictionRow}>
                  <ThemedText style={styles.predClass}>{topPrediction.class}</ThemedText>
                  <ThemedText>{formatConfidenceValue(topPrediction.confidence ?? topPrediction.confidence_score)}</ThemedText>
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

        <View style={styles.actions}>
          <Button title="Back" onPress={() => router.replace('/')} />
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  image: {
    width: '100%',
    height: 320,
    borderRadius: 8,
    backgroundColor: '#111',
  },
  card: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)'
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  predClass: {
    fontWeight: '600',
  },
  error: {
    color: 'red',
  },
  actions: {
    marginTop: 16,
  },
});
