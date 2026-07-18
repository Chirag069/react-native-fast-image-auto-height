import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import FastImage from 'react-native-fast-image-auto-height';
import { FEED_ITEMS } from './data';
import type { FeedItem } from './data';

/**
 * A full-width feed where every image sizes itself from its intrinsic
 * aspect ratio. `estimatedAspectRatio` keeps layout stable before the
 * intrinsic size is known; the skeleton placeholder and fade cover loading.
 */
export function FeedScreen() {
  const renderItem = useCallback(
    ({ item }: { item: FeedItem }) => (
      <View style={styles.card}>
        <FastImage
          source={{ uri: item.uri, priority: FastImage.priority.normal }}
          style={styles.image}
          autoHeight
          estimatedAspectRatio={4 / 3}
          placeholder={<View style={styles.skeleton} />}
          transitionDuration={200}
          retryCount={2}
        />
        <Text style={styles.title}>{item.title}</Text>
      </View>
    ),
    []
  );

  return (
    <FlatList
      data={FEED_ITEMS}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, gap: 16 },
  card: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#fafafa' },
  image: { width: '100%', borderRadius: 12 },
  skeleton: { flex: 1, backgroundColor: '#e8e8e8' },
  title: { padding: 10, fontSize: 13, color: '#555' },
});
