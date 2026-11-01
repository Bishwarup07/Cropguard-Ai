import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function SectionTitle({ title, action }: { title: string; action?: string }) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {action ? <Text style={[styles.action, { color: colors.primary }]}>{action}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.2 },
  action: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5 },
});