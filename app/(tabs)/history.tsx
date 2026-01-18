import { Image } from 'expo-image';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Platform, StyleSheet, FlatList, TouchableOpacity, RefreshControl, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const backgroundColor = getClassificationColor(item.classification);
    const date = new Date(item.timestamp);
    const dateStr = formatRelativeTimestamp(date.getTime());
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <ThemedView style={[styles.item, { backgroundColor }]}>
        <Image
          source={{ uri: item.thumbnailUri }}
          style={[styles.thumbnail, { width: thumbnailSize, height: thumbnailSize+15 }]}
          contentFit="cover"
        />
        <View style={styles.itemContent}>
          <View style={styles.itemTextContainer}>
            <ThemedText style={styles.itemTitle}>
              {item.className || 'Unknown Item'}
            </ThemedText>
            <ThemedText style={styles.itemSubtitle}>
              {item.classification}
              {item.confidence && ` • ${(item.confidence * 100).toFixed(1)}%`}
            </ThemedText>
            <ThemedText style={styles.itemTimestamp}>
              {dateStr} at {timeStr}
            </ThemedText>
          </View>
          <TouchableOpacity 
            onPress={() => handleDelete(item.id)}
            style={styles.deleteButton}
          >
            <IconSymbol name="trash" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">History</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.stepContainer}>
            <SearchBar
              placeholder="Search by item or classification..."
              onChangeText={updateSearch}
              value={search}
              platform={Platform.OS === 'ios' ? 'ios' : 'android'}
              containerStyle={styles.searchContainer}
              inputContainerStyle={styles.searchInputContainer}
              searchIcon={{ name: 'search', type: 'material' }}
              clearIcon={{ name: 'close', type: 'material' }}
            />
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
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stepContainer: {
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInputContainer: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    height: 44,
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  item: {
    flexDirection: 'row',
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  thumbnail: {
    borderRadius: 10,
    backgroundColor: '#f6f6f6',
    overflow: 'hidden',
    alignContent: 'center'
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTextContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.95,
    textTransform: 'capitalize',
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  itemTimestamp: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 20,
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

