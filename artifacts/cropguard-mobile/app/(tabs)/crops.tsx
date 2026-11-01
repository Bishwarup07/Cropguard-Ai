import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { Crop, useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';

const cropOptions = ['Rice (Paddy)', 'Wheat', 'Cotton', 'Sugarcane', 'Maize'];

function CropCard({ crop, onPress }: { crop: Crop; onPress: () => void }) {
  const colors = useColors();
  const { t, translateValue } = useLanguage();
  const statusColor = crop.status === 'alert' ? colors.destructive : crop.status === 'monitor' ? colors.warningForeground : colors.primary;
  const statusBg = crop.status === 'alert' ? colors.destructive + '18' : crop.status === 'monitor' ? colors.warning : colors.accent;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cropCard, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
      <View style={[styles.cropIcon, { backgroundColor: crop.status === 'alert' ? colors.secondary : colors.accent }]}>
        <Ionicons name="leaf-outline" size={25} color={colors.primary} />
      </View>
      <View style={styles.cropInfo}>
        <View style={styles.cropHeading}>
            <Text style={[styles.cropName, { color: colors.foreground }]}>{translateValue(crop.name)}</Text>
          <View style={[styles.statusChip, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{crop.status === 'alert' ? t('crops.pestAlert') : crop.status === 'monitor' ? t('crops.monitor') : t('crops.good')}</Text>
          </View>
        </View>
        <Text style={[styles.fieldName, { color: colors.mutedForeground }]}>{crop.field} · {t('crops.acresValue', { acres: crop.acres })}</Text>
        <View style={styles.stageRow}>
          <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.stage, { color: colors.mutedForeground }]}>{translateValue(crop.stage)}</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { width: `${crop.progress}%`, backgroundColor: statusColor }]} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function CropsScreen() {
  const colors = useColors();
  const { t, translateValue } = useLanguage();
  const insets = useSafeAreaInsets();
  const { crops, addCrop } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('Rice (Paddy)');
  const [field, setField] = useState('');
  const [acres, setAcres] = useState('');

  const saveCrop = () => {
    if (!field.trim() || !acres.trim() || Number.isNaN(Number(acres)) || Number(acres) <= 0) {
      Alert.alert(t('crops.addField'), t('crops.addFieldMessage'));
      return;
    }
    addCrop({ name, field: field.trim(), acres: Number(acres), status: 'good', progress: 0, stage: 'Newly added · Ready to scan' });
    setField('');
    setAcres('');
    setModalVisible(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title={t('crops.title')} eyebrow={t('crops.eyebrow')} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}>
        <Text style={[styles.heading, { color: colors.primary }]}>{t('crops.fields')}</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>{t('crops.subtitle')}</Text>
        <View style={styles.summaryRow}>
          <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.summaryNumber, { color: colors.primary }]}>{crops.length}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{t('crops.active')}</Text></View>
          <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.summaryNumber, { color: colors.primary }]}>{crops.reduce((total, crop) => total + crop.acres, 0)}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{t('crops.acres')}</Text></View>
          <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.summaryNumber, { color: colors.destructive }]}>{crops.filter((crop) => crop.status === 'alert').length}</Text><Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{t('crops.attention')}</Text></View>
        </View>
        <SectionTitle title={t('crops.health')} action={t('crops.tracked', { count: crops.length })} />
        {crops.map((crop) => <CropCard key={crop.id} crop={crop} onPress={() => Alert.alert(translateValue(crop.name), `${crop.field} · ${t('crops.acresValue', { acres: crop.acres })}\n\n${translateValue(crop.stage)}`)} />)}
        <Pressable onPress={() => setModalVisible(true)} style={({ pressed }) => [styles.addButton, { borderColor: colors.primary, backgroundColor: colors.card }, pressed && styles.pressed]}>
          <Ionicons name="add" size={19} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>{t('crops.add')}</Text>
        </Pressable>
      </ScrollView>
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: colors.foreground }]}>{t('crops.addTitle')}</Text><Pressable onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={colors.foreground} /></Pressable></View>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{t('crops.cropType')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options}>
              {cropOptions.map((option) => <Pressable key={option} onPress={() => setName(option)} style={[styles.option, { backgroundColor: name === option ? colors.primary : colors.secondary }]}><Text style={[styles.optionText, { color: name === option ? colors.primaryForeground : colors.primary }]}>{translateValue(option)}</Text></Pressable>)}
            </ScrollView>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{t('crops.fieldName')}</Text>
            <TextInput value={field} onChangeText={setField} placeholder={t('crops.fieldPlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{t('crops.area')}</Text>
            <TextInput value={acres} onChangeText={setAcres} keyboardType="decimal-pad" placeholder={t('crops.areaPlaceholder')} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <Pressable onPress={saveCrop} style={({ pressed }) => [styles.saveButton, { backgroundColor: colors.primary }, pressed && styles.buttonPressed]}><Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>{t('crops.save')}</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.7 },
  subheading: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 4, marginBottom: 18 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 27 },
  summary: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  summaryNumber: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  summaryLabel: { fontFamily: 'Inter_400Regular', fontSize: 10.5, marginTop: 3 },
  cropCard: { borderWidth: 1, borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 12 },
  cropIcon: { width: 53, height: 53, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cropInfo: { flex: 1 },
  cropHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 },
  cropName: { fontFamily: 'Inter_600SemiBold', fontSize: 15.5, flex: 1 },
  statusChip: { borderRadius: 13, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontFamily: 'Inter_700Bold', fontSize: 9.5, letterSpacing: 0.4 },
  fieldName: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4, marginBottom: 9 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  stage: { fontFamily: 'Inter_400Regular', fontSize: 11.5, flex: 1 },
  progressTrack: { height: 5, borderRadius: 5, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 5 },
  addButton: { minHeight: 52, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 4 },
  addButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,20,12,0.45)' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  inputLabel: { fontFamily: 'Inter_500Medium', fontSize: 12.5, marginBottom: 7, marginTop: 13 },
  options: { gap: 8, paddingBottom: 3 },
  option: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16 },
  optionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 11, minHeight: 48, paddingHorizontal: 13, fontFamily: 'Inter_400Regular', fontSize: 14 },
  saveButton: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 23 },
  saveButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14.5 },
  pressed: { opacity: 0.7 },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});