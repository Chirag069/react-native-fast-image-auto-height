import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image-auto-height';
import type { ResolvedImageSize } from 'react-native-fast-image-auto-height';
import { FEED_ITEMS } from './data';
import type { FeedItem } from './data';

const COLUMN_COUNT = 2;
const GUTTER = 10;

interface MeasuredItem extends FeedItem {
  aspectRatio: number;
}

/**
 * Pinterest/masonry layout: `FastImage.prefetchSize()` resolves every
 * aspect ratio up front (one deduplicated probe per URL), the columns are
 * balanced by height, and each cell mounts at its final size — zero jumps.
 */
export function PinterestScreen() {
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<MeasuredItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(
      FEED_ITEMS.map((item) => FastImage.prefetchSize({ uri: item.uri }))
    ).then((results) => {
      if (cancelled) {
        return;
      }
      const measured: MeasuredItem[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const size: ResolvedImageSize = result.value;
          measured.push({ ...FEED_ITEMS[index]!, aspectRatio: size.aspectRatio });
        }
      });
      setItems(measured);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  const columnWidth =
    (width - GUTTER * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

  // Greedy balancing: each item goes to the currently shortest column.
  const columns: MeasuredItem[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  const heights = new Array<number>(COLUMN_COUNT).fill(0);
  for (const item of items) {
    const target = heights.indexOf(Math.min(...heights));
    columns[target]!.push(item);
    heights[target]! += columnWidth / item.aspectRatio + GUTTER;
  }

  return (
    <ScrollView contentContainerStyle={styles.grid}>
      {columns.map((column, columnIndex) => (
        <View key={columnIndex} style={styles.column}>
          {column.map((item) => (
            <FastImage
              key={item.id}
              source={{ uri: item.uri }}
              style={[styles.cell, { width: columnWidth }]}
              autoHeight
              transitionDuration={150}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', gap: GUTTER, padding: GUTTER },
  column: { flex: 1, gap: GUTTER },
  cell: { borderRadius: 10 },
});
