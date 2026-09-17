import { Image } from 'expo-image';
import type { LayoutChangeEvent } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ProfileHeaderProps {
  onLayout?: (event: LayoutChangeEvent) => void;
}

export function ProfileHeader({ onLayout }: ProfileHeaderProps) {
  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.mainRow}>
        <Image
          source="https://picsum.photos/seed/novalabs-avatar/240/240.webp"
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />

        <View style={styles.stats}>
          <Stat value="913" label="publications" />
          <Stat value="16,9 M" label="followers" />
          <Stat value="3" label="suivi(e)s" />
        </View>
      </View>

      <View style={styles.bio}>
        <Text style={styles.name}>Nova Labs</Text>
        <Text style={styles.description}>
          Building launch systems, satellites and ambitious software for space.
        </Text>
        <Text style={styles.translation}>Voir la traduction</Text>
        <Text style={styles.link}>↗ novalabs.example</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, styles.followButton]}>
          <Text style={[styles.actionText, styles.followText]}>Suivre</Text>
        </Pressable>

        <Pressable style={styles.actionButton}>
          <Text style={styles.actionText}>Envoyer un message</Text>
        </Pressable>

        <Pressable style={styles.personButton}>
          <Text style={styles.personButtonText}>♙+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#efefef',
  },
  stats: {
    flex: 1,
    marginLeft: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#222',
  },
  bio: {
    marginTop: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111',
  },
  description: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: '#202020',
  },
  translation: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#111',
  },
  link: {
    marginTop: 3,
    fontSize: 12,
    color: '#2d5f87',
  },
  actions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flex: 1,
    height: 32,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#efefef',
  },
  followButton: {
    backgroundColor: '#4b61ff',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171717',
  },
  followText: {
    color: '#fff',
  },
  personButton: {
    width: 34,
    height: 32,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#efefef',
  },
  personButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
});
