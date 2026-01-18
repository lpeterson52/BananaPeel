import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Platform, StyleSheet, FlatList, TouchableOpacity, RefreshControl, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassView } from "expo-glass-effect";
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SearchBar } from '@rneui/themed';

import { 
  getHistory, 
  deleteHistoryItem, 
  HistoryItem,
  getClassificationColor,
  formatRelativeTimestamp
} from '../../util/historyStorage';

// Create an animated version of ThemedView so we can apply animated styles
const AnimatedThemedViewBase = Animated.createAnimatedComponent(ThemedView as any);

// Wrap the animated component in a typed React.FC so TypeScript understands it accepts children and style props
const AnimatedThemedView: React.FC<React.PropsWithChildren<React.ComponentProps<typeof ThemedView>>> = (props) => {
  // forward props to the underlying animated component; cast to any since reanimated types can be complex
  return <AnimatedThemedViewBase {...(props as any)}>{props.children}</AnimatedThemedViewBase>;
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const thumbnailSize = Math.min(96, Math.max(80, Math.floor(width * 0.18)));

  const loadHistory = async () => {
    try {
      const items = await getHistory();
      setHistory(items);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Reload when the tab becomes focused so newly saved items appear immediately
  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      loadHistory();
    }
  }, [isFocused]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, []);

  const updateSearch = (search: string) => {
    setSearch(search);
  };

  // Filter history based on search query
  const filteredHistory = useMemo(() => {
    if (!search.trim()) return history;
    
    const searchLower = search.toLowerCase();
    return history.filter(item => 
      item.className?.toLowerCase().includes(searchLower) ||
      item.classification.toLowerCase().includes(searchLower)
    );
  }, [history, search]);

  const handleDelete = async (id: string) => {
    try {
      await deleteHistoryItem(id);
      await loadHistory();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const SwipeableItem = ({ item }: { item: HistoryItem }) => {
    const translateX = useSharedValue(0);
    const borderPulse = useSharedValue(0);
    const hasTriggeredHaptic = useSharedValue(false);
    const itemHeight = thumbnailSize + 24 + 8;
    const backgroundColor = getClassificationColor(item.classification);
    const date = new Date(item.timestamp);
    const dateStr = formatRelativeTimestamp(date.getTime());
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const threshold = -width * 0.3;

    const triggerHaptic = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const triggerPulse = () => {
      borderPulse.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 10 })
      );
    };

    const panGesture = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-10, 10])
      .onUpdate((event) => {
        translateX.value = Math.min(0, event.translationX);
        
        if (translateX.value < threshold && !hasTriggeredHaptic.value) {
          hasTriggeredHaptic.value = true;
          runOnJS(triggerHaptic)();
          runOnJS(triggerPulse)();
        } else if (translateX.value >= threshold) {
          hasTriggeredHaptic.value = false;
        }
      })
      .onEnd(() => {
        if (translateX.value < threshold) {
          translateX.value = withSpring(-width, { damping: 20, stiffness: 90 });
          runOnJS(handleDelete)(item.id);
        } else {
          translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
        }
        hasTriggeredHaptic.value = false;
      });

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { 
          rotate: `${interpolate(
            translateX.value,
            [0, -width],
            [0, -8],
            Extrapolation.CLAMP
          )}deg` 
        },
      ],
      opacity: interpolate(
        translateX.value,
        [0, -width / 2],
        [1, 0.3],
        Extrapolation.CLAMP
      ),
    }));

    const overlayStyle = useAnimatedStyle(() => {
      const redChannel = interpolate(translateX.value, [0, -width * 0.3], [0, 255], Extrapolation.CLAMP);
      const pulseWhite = interpolate(borderPulse.value, [0, 1], [0, 200], Extrapolation.CLAMP);
      const overlayAlpha = interpolate(translateX.value, [0, -width * 0.3], [0, 0.6], Extrapolation.CLAMP);

      return {
        backgroundColor: `rgba(${Math.min(255, redChannel + pulseWhite)}, ${pulseWhite}, ${pulseWhite}, ${overlayAlpha})`,
      };
    });

    return (
      <GestureDetector gesture={panGesture}>
        <AnimatedThemedView style={[styles.item, { height: itemHeight, position: 'relative', backgroundColor }, animatedStyle]}>
          <GlassView style={[styles.glassOverlay, { borderRadius: 14 }]} />
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 14 }, overlayStyle]} />
          <Image
            source={{ uri: item.thumbnailUri }}
            style={[styles.thumbnail, { width: thumbnailSize, height: thumbnailSize + 8 }]}
            contentFit="cover"
          />
          <View style={styles.itemContent}>
            <View style={styles.itemTextContainer}>
              <ThemedText style={styles.itemTitle}>
                {item.className || 'Unknown Item'}
              </ThemedText>
              <GlassView isInteractive style={styles.itemSubtitleContainer}>
                <ThemedText style={styles.itemSubtitle}>
                  {item.classification}
                  {item.confidence && ` • ${(item.confidence * 100).toFixed(1)}%`}
                </ThemedText>
              </GlassView>
              <ThemedText style={styles.itemTimestamp}>
                {dateStr} at {timeStr}
              </ThemedText>
            </View>
            <GlassView style={styles.deleteButton} isInteractive glassEffectStyle="clear">
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <IconSymbol name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            </GlassView>
          </View>
        </AnimatedThemedView>
      </GestureDetector>
    );
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    return <SwipeableItem item={item} />;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          <ThemedView style={styles.container}>
            <ThemedView style={styles.titleContainer}>
              <ThemedText type="title">History</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.stepContainer}>
              <GlassView isInteractive style={styles.searchContainer}>
                <SearchBar
                  placeholder="Search by item or classification..."
                  onChangeText={updateSearch}
                  value={search}
                  platform={Platform.OS === 'ios' ? 'ios' : 'android'}
                  containerStyle={styles.searchContainer2}
                  inputContainerStyle={styles.searchContainer2}
                  searchIcon={{ name: 'search', type: 'material' }}
                  clearIcon={{ name: 'close', type: 'material' }}
                />
              </GlassView>
            </ThemedView>

            {loading ? (
              <ThemedView style={styles.emptyContainer}>
                <ThemedText>Loading history...</ThemedText>
              </ThemedView>
            ) : filteredHistory.length === 0 ? (
              <ThemedView style={styles.emptyContainer}>
                <IconSymbol name="clock" size={48} color="#999" />
                <ThemedText style={styles.emptyText}>
                  {search ? 'No matching items found' : 'No items scanned yet'}
                </ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  {search ? 'Try a different search term' : 'Start scanning items to build your history'}
                </ThemedText>
              </ThemedView>
            ) : (
              <FlatList
                data={filteredHistory}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              />
            )}
          </ThemedView>
        </SafeAreaView>
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  stepContainer: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderRadius: 100,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer2: {
    backgroundColor: 'transparent',
  },
  searchInputContainer: {
    borderRadius: 10,
    height: 40,
  },
  listContent: {
    paddingBottom: 60,
    paddingTop: 8,
  },
  item: {
    flexDirection: 'row',
    padding: 10,
    marginVertical: 6,
    marginHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  glassFallback: {
    backgroundColor: 'rgba(255,255,255,0.04)'
  },
  thumbnail: {
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
    overflow: 'hidden',
    alignContent: 'center',
    marginRight: 10,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 6,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
    textTransform: 'capitalize'
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.95,
    textTransform: 'capitalize',
  },
  itemSubtitleContainer: {
    marginBottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  itemTimestamp: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.85,
  },
  deleteButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.14)',
    borderRadius: 999,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
});

