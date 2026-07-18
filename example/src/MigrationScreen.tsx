import { ScrollView, StyleSheet, Text } from 'react-native';
// The entire migration from react-native-fast-image is this import line:
import FastImage from 'react-native-fast-image-auto-height';

/**
 * Every prop below is classic FastImage — copied verbatim from a FastImage
 * codebase. Nothing else changed.
 */
export function MigrationScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Classic FastImage API, unchanged</Text>

      <FastImage
        style={styles.fixed}
        source={{
          uri: 'https://picsum.photos/seed/classic/400/400',
          priority: FastImage.priority.high,
          cache: FastImage.cacheControl.immutable,
        }}
        resizeMode={FastImage.resizeMode.cover}
        onLoadStart={() => console.log('load start')}
        onProgress={(e) =>
          console.log(`progress ${e.nativeEvent.loaded}/${e.nativeEvent.total}`)
        }
        onLoad={(e) =>
          console.log(
            `loaded ${e.nativeEvent.width}x${e.nativeEvent.height}`
          )
        }
        onLoadEnd={() => console.log('load end')}
      />

      <Text style={styles.caption}>
        resizeMode=cover, priority=high, cache=immutable
      </Text>

      <FastImage
        style={styles.fixed}
        source={{ uri: 'https://picsum.photos/seed/tinted/400/400' }}
        resizeMode={FastImage.resizeMode.contain}
        tintColor="#4477ff"
      />
      <Text style={styles.caption}>tintColor + resizeMode=contain</Text>

      <Text style={styles.heading}>Then adopt new powers incrementally</Text>

      <FastImage
        source={{ uri: 'https://picsum.photos/seed/upgraded/900/300' }}
        style={styles.auto}
        autoHeight
        estimatedAspectRatio={3}
        transitionDuration={200}
        onSizeResolved={({ width, height, fromCache }) =>
          console.log(`resolved ${width}x${height} (fromCache: ${fromCache})`)
        }
      />
      <Text style={styles.caption}>
        Same component, plus autoHeight + fade + onSizeResolved
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  heading: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  fixed: { width: 160, height: 160, borderRadius: 12 },
  auto: { width: '100%', borderRadius: 12 },
  caption: { fontSize: 12, color: '#777' },
});
