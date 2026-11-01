import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';

type Category = 'pesticides' | 'fertilizers' | 'labor';
type Item = { product: string; rate: string; price: string; unit: string };

const categoryLabels: Record<Category, string> = { pesticides: 'Chemical inputs', fertilizers: 'Fertilizer inputs', labor: 'Labor & operations' };
const categoryProducts: Record<Category, { product: string; unit: string }[]> = {
  pesticides: [{ product: 'Glyphosate 41%', unit: 'oz' }, { product: 'Fungicide (Azoxystrobin)', unit: 'oz' }, { product: 'Insecticide (Imidacloprid)', unit: 'ml' }],
  fertilizers: [{ product: 'Urea (46-0-0)', unit: 'kg' }, { product: 'DAP (18-46-0)', unit: 'kg' }, { product: 'MOP (0-0-60)', unit: 'kg' }],
  labor: [{ product: 'Field labor (daily wage)', unit: 'days' }, { product: 'Tractor operation', unit: 'hrs' }, { product: 'Irrigation setup', unit: 'hrs' }],
};

const seedItems: Record<Category, Item[]> = {
  pesticides: [{ product: 'Glyphosate 41%', rate: '32', unit: 'oz', price: '18.50' }, { product: 'Fungicide (Azoxystrobin)', rate: '6', unit: 'oz', price: '145' }],
  fertilizers: [{ product: 'Urea (46-0-0)', rate: '50', unit: 'kg', price: '24' }],
  labor: [{ product: 'Field labor (daily wage)', rate: '4', unit: 'days', price: '350' }],
};

export default function CalculatorScreen() {
  const colors = useColors();
  const { t, translateValue } = useLanguage();
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState('50');
  const [cropType, setCropType] = useState('Rice (Paddy)');
  const [category, setCategory] = useState<Category>('pesticides');
  const [items, setItems] = useState<Record<Category, Item[]>>(seedItems);
  const [unit, setUnit] = useState('Acres');
  const currentItems = items[category];
  const unitLabel = t('data.acres');
  const categoryLabel = category === 'pesticides' ? t('calculator.chemicalInputs') : category === 'fertilizers' ? t('calculator.fertilizerInputs') : t('calculator.laborOperations');

  const totals = useMemo(() => {
    const values = (Object.keys(items) as Category[]).reduce((result, key) => {
      result[key] = items[key].reduce((sum, item) => sum + (Number(item.rate) || 0) * (Number(item.price) || 0) * (Number(area) || 0), 0);
      return result;
    }, {} as Record<Category, number>);
    return { ...values, total: values.pesticides + values.fertilizers + values.labor };
  }, [area, items]);

  const addItem = () => {
    const first = categoryProducts[category][0];
    setItems((current) => ({ ...current, [category]: [...current[category], { product: first.product, unit: first.unit, rate: '0', price: '0' }] }));
  };

  const updateItem = (index: number, field: 'rate' | 'price', value: string) => {
    setItems((current) => ({ ...current, [category]: current[category].map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }));
  };

  const deleteItem = (index: number) => setItems((current) => ({ ...current, [category]: current[category].filter((_, itemIndex) => itemIndex !== index) }));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title={t('calculator.title')} eyebrow={t('calculator.eyebrow')} back />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        <View style={[styles.configCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.configTitleRow}><Ionicons name="options-outline" size={19} color={colors.primary} /><Text style={[styles.configTitle, { color: colors.foreground }]}>{t('calculator.configuration')}</Text></View>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('calculator.totalArea')}</Text>
          <View style={[styles.areaRow, { borderColor: colors.border, backgroundColor: colors.background }]}><TextInput value={area} onChangeText={setArea} keyboardType="decimal-pad" style={[styles.areaInput, { color: colors.foreground }]} /><View style={[styles.unitPill, { backgroundColor: colors.secondary }]}><Text style={[styles.unitText, { color: colors.primary }]}>{unitLabel}</Text></View></View>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{t('calculator.cropType')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropOptions}>{['Rice (Paddy)', 'Wheat', 'Cotton', 'Maize'].map((option) => <Pressable key={option} onPress={() => setCropType(option)} style={[styles.cropOption, { backgroundColor: cropType === option ? colors.primary : colors.secondary }]}><Text style={[styles.cropOptionText, { color: cropType === option ? colors.primaryForeground : colors.primary }]}>{translateValue(option)}</Text></Pressable>)}</ScrollView>
        </View>
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {(Object.keys(categoryLabels) as Category[]).map((key) => <Pressable key={key} onPress={() => setCategory(key)} style={[styles.tab, { borderBottomColor: category === key ? colors.primary : 'transparent' }]}><Ionicons name={key === 'pesticides' ? 'bug-outline' : key === 'fertilizers' ? 'flask-outline' : 'people-outline'} size={18} color={category === key ? colors.primary : colors.mutedForeground} /><Text style={[styles.tabText, { color: category === key ? colors.primary : colors.mutedForeground }]}>{key === 'pesticides' ? t('calculator.pesticides') : key === 'fertilizers' ? t('calculator.fertilizers') : t('calculator.labor')}</Text></Pressable>)}
        </View>
        <View style={styles.itemsHeader}><Text style={[styles.itemsTitle, { color: colors.foreground }]}>{categoryLabel}</Text><Pressable onPress={addItem} style={({ pressed }) => [styles.addItem, pressed && styles.pressed]}><Ionicons name="add" size={16} color={colors.primary} /><Text style={[styles.addItemText, { color: colors.primary }]}>{t('calculator.addItem')}</Text></Pressable></View>
        {currentItems.map((item, index) => <View key={`${category}-${index}`} style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.itemHeader}><Text style={[styles.itemName, { color: colors.foreground }]}>{translateValue(item.product)}</Text><Pressable accessibilityLabel={t('calculator.delete', { product: translateValue(item.product) })} onPress={() => deleteItem(index)}><Ionicons name="trash-outline" size={17} color={colors.destructive} /></Pressable></View><View style={styles.itemFields}><View style={styles.field}><Text style={[styles.label, { color: colors.mutedForeground }]}>{t('calculator.rate')}</Text><View style={[styles.numberField, { borderColor: colors.border }]}><TextInput value={item.rate} onChangeText={(value) => updateItem(index, 'rate', value)} keyboardType="decimal-pad" style={[styles.numberInput, { color: colors.foreground }]} /><Text style={[styles.suffix, { color: colors.mutedForeground }]}>{translateValue(item.unit)}</Text></View></View><View style={styles.field}><Text style={[styles.label, { color: colors.mutedForeground }]}>{t('calculator.unitPrice')}</Text><View style={[styles.numberField, { borderColor: colors.border }]}><Text style={[styles.rupee, { color: colors.mutedForeground }]}>₹</Text><TextInput value={item.price} onChangeText={(value) => updateItem(index, 'price', value)} keyboardType="decimal-pad" style={[styles.numberInput, { color: colors.foreground }]} /></View></View></View></View>)}
        <View style={[styles.summary, { backgroundColor: colors.primary }]}><Text style={[styles.summaryEyebrow, { color: colors.accent }]}>{t('calculator.totalCost')}</Text><Text style={[styles.total, { color: colors.primaryForeground }]}>₹{Math.round(totals.total).toLocaleString('en-IN')}</Text><Text style={[styles.summarySub, { color: colors.accent }]}>{t('calculator.basedOn', { area: area || 0, unit: unitLabel, perArea: Number(area) > 0 ? Math.round(totals.total / Number(area)).toLocaleString('en-IN') : 0, shortUnit: unitLabel })}</Text><View style={[styles.divider, { backgroundColor: colors.primaryForeground + '28' }]} />{(['pesticides', 'fertilizers', 'labor'] as Category[]).map((key) => <View key={key} style={styles.breakdown}><View style={styles.breakdownLabel}><View style={[styles.breakdownDot, { backgroundColor: key === 'pesticides' ? colors.accent : key === 'fertilizers' ? colors.infoForeground : colors.muted }]} /><Text style={[styles.breakdownText, { color: colors.primaryForeground }]}>{key === 'pesticides' ? t('calculator.pesticides') : key === 'fertilizers' ? t('calculator.fertilizers') : t('calculator.laborOps')}</Text></View><Text style={[styles.breakdownValue, { color: colors.primaryForeground }]}>₹{Math.round(totals[key]).toLocaleString('en-IN')}</Text></View>)}</View>
        <Pressable onPress={() => Alert.alert(t('calculator.savedTitle'), t('calculator.savedMessage', { crop: translateValue(cropType), area: area || 0, unit: unitLabel }))} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.buttonPressed]}><Ionicons name="bookmark-outline" size={18} color={colors.primaryForeground} /><Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{t('calculator.save')}</Text></Pressable>
        <Pressable onPress={() => Alert.alert(t('calculator.reportTitle'), t('calculator.reportMessage'))} style={({ pressed }) => [styles.secondaryButton, { borderColor: colors.primary, backgroundColor: colors.card }, pressed && styles.pressed]}><Ionicons name="document-text-outline" size={18} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{t('calculator.export')}</Text></Pressable>
        <View style={[styles.insight, { backgroundColor: colors.info }]}><Ionicons name="bulb-outline" size={19} color={colors.infoForeground} /><View style={{ flex: 1 }}><Text style={[styles.insightTitle, { color: colors.infoForeground }]}>{t('calculator.insight')}</Text><Text style={[styles.insightText, { color: colors.infoForeground }]}>{t('calculator.insightText')}</Text></View></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18 },
  configCard: { borderWidth: 1, borderRadius: 17, padding: 17 },
  configTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  configTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 11.5, marginBottom: 6, marginTop: 11 },
  areaRow: { minHeight: 48, borderWidth: 1, borderRadius: 11, flexDirection: 'row', alignItems: 'center', paddingLeft: 12, overflow: 'hidden' },
  areaInput: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15, paddingVertical: 10 },
  unitPill: { paddingHorizontal: 14, paddingVertical: 8, marginRight: 7, borderRadius: 8 },
  unitText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  cropOptions: { gap: 7, paddingVertical: 2 },
  cropOption: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 15 },
  cropOptionText: { fontFamily: 'Inter_600SemiBold', fontSize: 11.5 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, marginTop: 21 },
  tab: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 12, borderBottomWidth: 2 },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 21, marginBottom: 12 },
  itemsTitle: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  addItem: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 6 },
  addItemText: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5 },
  itemCard: { borderWidth: 1, borderRadius: 15, padding: 14, marginBottom: 11 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  itemName: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5, flex: 1 },
  itemFields: { flexDirection: 'row', gap: 10 },
  field: { flex: 1 },
  numberField: { minHeight: 44, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  numberInput: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, paddingVertical: 8, paddingHorizontal: 3 },
  suffix: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  rupee: { fontFamily: 'Inter_500Medium', fontSize: 13, paddingHorizontal: 3 },
  summary: { borderRadius: 18, padding: 20, marginTop: 7 },
  summaryEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  total: { fontFamily: 'Inter_700Bold', fontSize: 35, marginTop: 4, letterSpacing: -1 },
  summarySub: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  divider: { height: 1, marginVertical: 16 },
  breakdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  breakdownLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownText: { fontFamily: 'Inter_400Regular', fontSize: 12.5 },
  breakdownValue: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5 },
  primaryButton: { minHeight: 51, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 16 },
  primaryButtonText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  secondaryButton: { minHeight: 51, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 10 },
  secondaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  insight: { borderRadius: 15, padding: 14, flexDirection: 'row', gap: 10, marginTop: 16 },
  insightTitle: { fontFamily: 'Inter_700Bold', fontSize: 13, marginBottom: 3 },
  insightText: { fontFamily: 'Inter_400Regular', fontSize: 12.5, lineHeight: 18 },
  pressed: { opacity: 0.7 },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});