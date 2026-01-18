import { Image } from 'expo-image';
import { useMemo , useState } from 'react';
import { Platform, StyleSheet , FlatList, ScrollView} from 'react-native';
import {SafeAreaView, SafeAreaProvider} from 'react-native-safe-area-context';


import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';

import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { SearchBar } from '@rneui/themed';
// import { ScrollView } from 'react-native-reanimated/lib/typescript/Animated';





export default function SearchScreen() {
  const DATA = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({ id: String(i), title: `Item ${i}` })),
    []
  );

  type ItemProps = {title: string};

  const Item = ({title}: ItemProps) => (
    <ThemedView style={styles.item}>
      <ThemedText style={styles.title}>{title}</ThemedText>
    </ThemedView>
  );

  const [search, setSearch] = useState("");
  
  const updateSearch = (search: string) => {
    setSearch(search);
  };

  return (
    <SafeAreaView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Search</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <SearchBar
          placeholder="Type Here..."
          onChangeText={updateSearch}
          value={search}
        />
      </ThemedView>

      <FlatList
        data={DATA}
        renderItem={({item}) => <Item title={item.title} />}
        keyExtractor={item => item.id}
      />

    </SafeAreaView>
  );
  // };

  
}

const styles = StyleSheet.create({
  titleContainer: {
    // flexDirection: 'row',
    // alignItems: 'center',
    // gap: 8,
  },
  stepContainer: {
    // gap: 8,
    // marginBottom: 8,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
});

