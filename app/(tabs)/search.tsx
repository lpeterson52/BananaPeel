import { Image } from 'expo-image';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Platform, StyleSheet, FlatList, TouchableOpacity, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SearchBar } from '@rneui/themed';

import { 
  getHistory, 
  deleteHistoryItem, 
  HistoryItem,
  getClassificationColor 
} from '../../util/historyStorage';

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

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
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <ThemedView style={[styles.item, { backgroundColor }]}>
        <Image 
          source={{ uri: item.thumbnailUri }} 
          style={styles.thumbnail}
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
    paddingHorizontal: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  item: {
    flexDirection: 'row',
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
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
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  itemTimestamp: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
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

