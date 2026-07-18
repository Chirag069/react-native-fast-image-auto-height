import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FeedScreen } from './src/FeedScreen';
import { PinterestScreen } from './src/PinterestScreen';
import { MigrationScreen } from './src/MigrationScreen';

const SCREENS = {
  Feed: FeedScreen,
  Pinterest: PinterestScreen,
  Migration: MigrationScreen,
} as const;

type ScreenName = keyof typeof SCREENS;

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('Feed');
  const Screen = SCREENS[screen];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.tabs}>
        {(Object.keys(SCREENS) as ScreenName[]).map((name) => (
          <Pressable
            key={name}
            onPress={() => setScreen(name)}
            style={[styles.tab, screen === name && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, screen === name && styles.tabLabelActive]}>
              {name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Screen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
  },
  tabActive: { backgroundColor: '#111' },
  tabLabel: { fontSize: 14, fontWeight: '600', color: '#444' },
  tabLabelActive: { color: '#fff' },
});
