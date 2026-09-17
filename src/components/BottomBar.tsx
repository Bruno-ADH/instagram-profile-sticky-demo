import { StyleSheet, Text, View } from 'react-native';

const items = ['⌂', '⌕', '⊞', '▣', '●'];

export function BottomBar() {
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <Text key={`${item}-${index}`} style={styles.item}>
          {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e7e7e7',
    backgroundColor: '#fff',
  },
  item: {
    minWidth: 42,
    textAlign: 'center',
    fontSize: 24,
    color: '#111',
  },
});
