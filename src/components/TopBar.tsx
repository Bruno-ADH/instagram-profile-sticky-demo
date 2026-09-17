import { StyleSheet, Text, View } from 'react-native';

export function TopBar() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>‹</Text>

      <View style={styles.titleRow}>
        <Text style={styles.title}>novalabs</Text>
        <View style={styles.verified}>
          <Text style={styles.verifiedText}>✓</Text>
        </View>
      </View>

      <Text style={styles.menu}>⋮</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ececec',
    backgroundColor: '#fff',
  },
  icon: {
    width: 32,
    fontSize: 34,
    lineHeight: 36,
    color: '#111',
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  verified: {
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1697f6',
  },
  verifiedText: {
    fontSize: 10,
    lineHeight: 12,
    color: '#fff',
    fontWeight: '900',
  },
  menu: {
    width: 28,
    textAlign: 'right',
    fontSize: 26,
    lineHeight: 28,
    color: '#111',
  },
});
