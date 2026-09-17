import { Image } from 'expo-image';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FeedPhoto, TabKey } from '../types/profile';

interface PhotoCellProps {
  photo: FeedPhoto;
  tab: TabKey;
}

export const PhotoCell = memo(function PhotoCell({ photo, tab }: PhotoCellProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: photo.thumbnailUrl }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={photo.key}
        transition={80}
      />

      {tab === 'reels' ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>▶</Text>
        </View>
      ) : null}

      {tab === 'tagged' ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>♙</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 0.5,
    borderColor: '#fff',
    backgroundColor: '#e9e9e9',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
  },
});
