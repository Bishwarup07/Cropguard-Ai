import { Ionicons } from '@expo/vector-icons';
import { useGetCurrentWeather } from '@workspace/api-client-react';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { useApp } from '@/context/AppContext';
import { languages, useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <View style={{ height: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: `${color}22` }}>
      <View style={{ width: `${value}%`, height: '100%', borderRadius: 8, backgroundColor: color }} />
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { crops, scans, syncStatus } = useApp();
  const { language, languageName, setLanguage, t, translateValue } = useLanguage();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationAttempt, setLocationAttempt] = useState(0);
  const attentionCount = crops.filter((crop) => crop.status === 'alert').length;
  const latestScan = scans[0];

  useEffect(() => {
    let cancelled = false;

    async function loadLocation() {
      setLocationLoading(true);
      setLocationDenied(false);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          if (!cancelled) setLocationDenied(true);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setCoordinates({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch {
        if (!cancelled) setLocationDenied(true);
      } finally {
        if (!cancelled) setLocationLoading(false);
      }
    }

    void loadLocation();
    return () => {
      cancelled = true;
    };
  }, [locationAttempt]);

  const weatherQuery = useGetCurrentWeather(
    {
      latitude: coordinates?.latitude ?? 0,
      longitude: coordinates?.longitude ?? 0,
      language,
    },
    {
      query: {
        enabled: Boolean(coordinates),
        staleTime: 10 * 60 * 1000,
        retry: 1,
      } as any,
    }
  );
  const weather = weatherQuery.data;
  const weatherLoading = locationLoading || weatherQuery.isLoading;
  const weatherText = weatherLoading
    ? t('dashboard.weatherLoading')
    : weather
      ? `${Math.round(weather.temperatureC)}°C · ${weather.description}`
      : locationDenied
        ? t('dashboard.weatherLocation')
        : t('dashboard.weatherUnavailable');
  const weatherIcon = weather?.conditionType?.includes('RAIN')
    ? 'rainy-outline'
    : weather?.conditionType?.includes('CLOUD')
      ? 'cloudy-outline'
      : 'sunny-outline';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title={t('app.name')} eyebrow={t('app.eyebrow')} onAction={() => Alert.alert(t('dashboard.alerts'), t('dashboard.alertMessage', { count: attentionCount || 0 }))} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}>
        <View style={styles.greeting}>
          <View>
            <Text style={[styles.greetingTitle, { color: colors.primary }]}>{t('dashboard.hello')}</Text>
            <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>{t('dashboard.summary')}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.refreshWeather')}
            onPress={() => {
              if (coordinates) {
                void weatherQuery.refetch();
              } else {
                setLocationAttempt((attempt) => attempt + 1);
              }
            }}
            style={({ pressed }) => [styles.weather, { backgroundColor: colors.info }, pressed && styles.pressed]}
          >
            <Ionicons name={weatherIcon as 'sunny-outline'} size={16} color={colors.infoForeground} />
            <View style={styles.weatherCopy}>
              <Text style={[styles.weatherText, { color: colors.infoForeground }]}>{weatherText}</Text>
              {weather ? <Text style={[styles.weatherSource, { color: colors.infoForeground }]}>{t('dashboard.weatherSource')}</Text> : null}
            </View>
          </Pressable>
          <View style={[styles.syncChip, { backgroundColor: syncStatus === 'synced' ? colors.accent : colors.warning }]}>
            <Ionicons name={syncStatus === 'synced' ? 'cloud-done-outline' : 'cloud-offline-outline'} size={14} color={syncStatus === 'synced' ? colors.primary : colors.warningForeground} />
            <Text style={[styles.syncText, { color: syncStatus === 'synced' ? colors.primary : colors.warningForeground }]}>{syncStatus === 'synced' ? t('dashboard.cloudSync') : t('dashboard.offline')}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('language.choose')}
            onPress={() => setLanguageModalVisible(true)}
            style={({ pressed }) => [styles.languageCard, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
          >
            <View style={[styles.languageIcon, { backgroundColor: colors.secondary }]}>
              <Ionicons name="language-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.languageCopy}>
              <Text style={[styles.languageLabel, { color: colors.mutedForeground }]}>{t('language.title')}</Text>
              <Text style={[styles.languageName, { color: colors.foreground }]}>{languageName}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardTop}>
            <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}><Ionicons name="water-outline" size={19} color={colors.primary} /></View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t('dashboard.soilMoisture')}</Text>
            <View style={[styles.badge, { backgroundColor: colors.accent }]}><Text style={[styles.badgeText, { color: colors.primary }]}>{t('dashboard.optimal')}</Text></View>
          </View>
          <Text style={[styles.bigStat, { color: colors.primary }]}>65%</Text>
          <ProgressBar value={65} color={colors.primary} />
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>{t('dashboard.noIrrigation')}</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardTop}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}><Ionicons name="leaf-outline" size={19} color={colors.primaryForeground} /></View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t('dashboard.cropHealth')}</Text>
            <View style={[styles.badge, { backgroundColor: colors.accent }]}><Text style={[styles.badgeText, { color: colors.primary }]}>{t('dashboard.good')}</Text></View>
          </View>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{t('dashboard.latestScan')}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/scan')} style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
            <Text style={[styles.linkText, { color: colors.primary }]}>{t('dashboard.viewReport')}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </Pressable>
        </View>

        <Pressable testID="scan-crop-button" accessibilityRole="button" onPress={() => router.push('/scan')} style={({ pressed }) => [styles.scanButton, { backgroundColor: colors.primary }, pressed && styles.buttonPressed]}>
          <Ionicons name="scan-outline" size={21} color={colors.primaryForeground} />
          <Text style={[styles.scanButtonText, { color: colors.primaryForeground }]}>{t('dashboard.scanCrop')}</Text>
        </Pressable>
        <SectionTitle title={t('dashboard.recent')} action={t('dashboard.viewAll')} />
        <Pressable accessibilityRole="button" onPress={() => router.push('/scan')} style={({ pressed }) => [styles.alertCard, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
          <View style={[styles.alertIcon, { backgroundColor: `${colors.destructive}18` }]}><Ionicons name="warning-outline" size={18} color={colors.destructive} /></View>
          <View style={styles.alertCopy}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{latestScan ? translateValue(latestScan.finding) : t('dashboard.noAlerts')}</Text>
            <Text style={[styles.alertSub, { color: colors.mutedForeground }]}>{latestScan ? translateValue(latestScan.location) : t('dashboard.firstInsight')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>
        <View style={[styles.tipCard, { backgroundColor: colors.secondary }]}>
          <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.secondaryForeground }]}>{t('dashboard.tip')}</Text>
        </View>
      </ScrollView>
      <Modal visible={languageModalVisible} transparent animationType="fade" onRequestClose={() => setLanguageModalVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLanguageModalVisible(false)}>
          <Pressable style={[styles.languageModal, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('language.choose')}</Text>
            {languages.map((item) => (
              <Pressable
                key={item.code}
                onPress={() => {
                  setLanguage(item.code);
                  setLanguageModalVisible(false);
                }}
                style={[styles.languageOption, { backgroundColor: item.code === language ? colors.secondary : colors.background, borderColor: item.code === language ? colors.primary : colors.border }]}
              >
                <View>
                  <Text style={[styles.optionNative, { color: colors.foreground }]}>{item.nativeLabel}</Text>
                  <Text style={[styles.optionEnglish, { color: colors.mutedForeground }]}>{item.label}</Text>
                </View>
                {item.code === language ? <Ionicons name="checkmark-circle" size={21} color={colors.primary} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22 },
  greeting: { marginBottom: 20, gap: 12 },
  greetingTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.8 },
  greetingSub: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 4 },
  weather: { alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 7, maxWidth: '100%' },
  weatherCopy: { flexShrink: 1 },
  weatherText: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5 },
  weatherSource: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2, opacity: 0.78 },
  syncChip: { alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 11, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  syncText: { fontFamily: 'Inter_600SemiBold', fontSize: 11.5 },
  languageCard: { minHeight: 58, borderWidth: 1, borderRadius: 15, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  languageIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  languageCopy: { flex: 1 },
  languageLabel: { fontFamily: 'Inter_500Medium', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.7 },
  languageName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 2 },
  metricCard: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconCircle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  cardTitle: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15.5 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  badgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.7 },
  bigStat: { fontFamily: 'Inter_700Bold', fontSize: 36, marginTop: 14, marginBottom: 10, letterSpacing: -1 },
  helper: { fontFamily: 'Inter_400Regular', fontSize: 12.5, marginTop: 9 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 15, marginBottom: 13 },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5 },
  scanButton: { minHeight: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 4, marginBottom: 14 },
  scanButtonText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  alertCard: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  alertIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  alertCopy: { flex: 1 },
  alertTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5, marginBottom: 3 },
  alertSub: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  tipCard: { borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12.5, lineHeight: 18 },
  pressed: { opacity: 0.7 },
  buttonPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: 'rgba(10,20,12,0.45)' },
  languageModal: { borderRadius: 22, padding: 18 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 19, marginBottom: 13 },
  languageOption: { minHeight: 58, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9, marginTop: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionNative: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  optionEnglish: { fontFamily: 'Inter_400Regular', fontSize: 11.5, marginTop: 2 },
});
