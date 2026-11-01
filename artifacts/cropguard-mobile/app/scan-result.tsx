import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';

type ResultSectionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  color: string;
};

function ResultSection({ icon, title, body, color }: ResultSectionProps) {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.sectionIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <View style={styles.sectionCopy}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.sectionBody, { color: colors.mutedForeground }]}>{body}</Text>
      </View>
    </View>
  );
}

export default function ScanResultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{
    imageUri?: string;
    disease?: string;
    confidence?: string;
    severity?: string;
    medicine?: string;
    fertilizer?: string;
    prevention?: string;
    usage?: string;
    inferenceMode?: string;
  }>();

  const isPreview = params.inferenceMode !== 'model';
  const confidence = Math.round(Math.max(0, Math.min(1, Number(params.confidence) || (isPreview ? 0.96 : 0))) * 100);
  const disease = isPreview ? t('result.previewDisease') : params.disease ?? t('result.previewDisease');
  const medicine = isPreview ? t('result.previewMedicine') : params.medicine ?? '';
  const fertilizer = isPreview ? t('result.previewFertilizer') : params.fertilizer ?? '';
  const prevention = isPreview ? t('result.previewPrevention') : params.prevention ?? '';
  const usage = isPreview ? t('result.previewUsage') : params.usage ?? '';
  const statusColor = params.severity === 'Alert' ? colors.destructive : params.severity === 'Monitor' ? colors.warningForeground : colors.primary;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title={t('result.title')} eyebrow={t('result.eyebrow')} back />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        {params.imageUri ? <Image source={{ uri: params.imageUri }} contentFit="cover" style={styles.photo} /> : null}
        <View style={[styles.modelChip, { backgroundColor: isPreview ? colors.warning : colors.accent }]}>
          <Ionicons name={isPreview ? 'flask-outline' : 'hardware-chip-outline'} size={15} color={isPreview ? colors.warningForeground : colors.primary} />
          <Text style={[styles.modelChipText, { color: isPreview ? colors.warningForeground : colors.primary }]}>{isPreview ? t('result.modelPreview') : t('result.modelLive')}</Text>
        </View>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.resultIcon, { backgroundColor: `${statusColor}18` }]}>
            <Ionicons name={params.severity === 'Alert' ? 'warning-outline' : 'leaf-outline'} size={28} color={statusColor} />
          </View>
          <Text style={[styles.heroEyebrow, { color: colors.mutedForeground }]}>{t('result.detected')}</Text>
          <Text style={[styles.disease, { color: colors.foreground }]}>{disease}</Text>
          <View style={styles.confidenceRow}>
            <Text style={[styles.confidenceLabel, { color: colors.mutedForeground }]}>{t('result.confidence', { value: confidence })}</Text>
            <Text style={[styles.confidenceValue, { color: statusColor }]}>{confidence}%</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { width: `${confidence}%`, backgroundColor: statusColor }]} />
          </View>
        </View>
        <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{t('result.recommendations')}</Text>
        <ResultSection icon="medkit-outline" title={t('result.medicine')} body={medicine} color={colors.destructive} />
        <ResultSection icon="leaf-outline" title={t('result.fertilizer')} body={fertilizer} color={colors.primary} />
        <ResultSection icon="shield-checkmark-outline" title={t('result.prevention')} body={prevention} color={colors.infoForeground} />
        <ResultSection icon="information-circle-outline" title={t('result.usage')} body={usage} color={colors.warningForeground} />
        {isPreview ? <Text style={[styles.note, { color: colors.mutedForeground }]}>{t('result.previewNote')}</Text> : null}
        <Pressable onPress={() => router.replace('/scan')} style={({ pressed }) => [styles.newScan, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
          <Ionicons name="scan-outline" size={19} color={colors.primaryForeground} />
          <Text style={[styles.newScanText, { color: colors.primaryForeground }]}>{t('result.newScan')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18 },
  photo: { width: '100%', height: 190, borderRadius: 18, marginBottom: 12, backgroundColor: '#dce8dc' },
  modelChip: { alignSelf: 'flex-start', borderRadius: 16, paddingHorizontal: 11, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  modelChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 11.5 },
  hero: { borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center' },
  resultIcon: { width: 62, height: 62, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  heroEyebrow: { fontFamily: 'Inter_500Medium', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  disease: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.5, textAlign: 'center', marginTop: 5 },
  confidenceRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 7 },
  confidenceLabel: { fontFamily: 'Inter_500Medium', fontSize: 12.5 },
  confidenceValue: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  progressTrack: { width: '100%', height: 8, borderRadius: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 8 },
  sectionHeading: { fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 24, marginBottom: 11 },
  section: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 11, marginBottom: 10 },
  sectionIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sectionCopy: { flex: 1 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 13.5, marginBottom: 4 },
  sectionBody: { fontFamily: 'Inter_400Regular', fontSize: 12.5, lineHeight: 18 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 11.5, lineHeight: 17, marginTop: 4 },
  newScan: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 17 },
  newScanText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});