import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface AppHeaderProps {
  title: string;
  eyebrow?: string;
  back?: boolean;
  action?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
}

export function AppHeader({ title, eyebrow, back = false, action = 'notifications-outline', onAction }: AppHeaderProps) {
  const colors = useColors();
  const { isDark, toggleMode } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.titleRow}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={21} color={colors.foreground} />
          </Pressable>
        ) : (
          <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
            <Ionicons name="leaf" size={18} color={colors.primaryForeground} />
          </View>
        )}
        <View style={styles.titleCopy}>
          {eyebrow ? <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>{eyebrow}</Text> : null}
          <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isDark ? t('common.switchLight') : t('common.switchDark')}
            hitSlop={10}
            onPress={toggleMode}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={colors.foreground} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.notifications')}
            hitSlop={10}
            onPress={onAction}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name={action} size={22} color={colors.foreground} />
            {!back ? <View style={[styles.notificationDot, { backgroundColor: colors.destructive, borderColor: colors.card }]} /> : null}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  titleRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleCopy: { flex: 1 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.3 },
  eyebrow: { fontFamily: 'Inter_500Medium', fontSize: 11, marginBottom: 1, textTransform: 'uppercase', letterSpacing: 1.1 },
  brandMark: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  notificationDot: { position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: 5, borderWidth: 1.5 },
  pressed: { opacity: 0.65 },
});