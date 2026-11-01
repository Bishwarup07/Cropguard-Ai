import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';

type Expert = { name: string; initials: string; role: string; category: string; rating: string; reviews: number; online: boolean };

const experts: Expert[] = [
  { name: 'Dr. Anjali Rao', initials: 'AR', role: 'Agronomist · 12 yrs experience', category: 'Agronomy', rating: '4.9', reviews: 210, online: true },
  { name: 'Suresh Patil', initials: 'SP', role: 'Pest Control Specialist', category: 'Pest Control', rating: '4.8', reviews: 156, online: true },
  { name: 'Dr. Meera Nair', initials: 'MN', role: 'Soil Health Consultant', category: 'Soil Health', rating: '4.7', reviews: 98, online: false },
  { name: 'Ramesh Iyer', initials: 'RI', role: 'Irrigation Engineer', category: 'Irrigation', rating: '4.9', reviews: 132, online: true },
  { name: 'Dr. Kavita Sharma', initials: 'KS', role: 'Agronomist · Rice & Wheat', category: 'Agronomy', rating: '4.6', reviews: 87, online: false },
];

const filters = ['All', 'Agronomy', 'Pest Control', 'Soil Health', 'Irrigation'];

export default function ExpertsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { t, translateValue } = useLanguage();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const filtered = activeFilter === 'All' ? experts : experts.filter((expert) => expert.category === activeFilter);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader title={t('experts.title')} eyebrow={t('experts.eyebrow')} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}>
        <Text style={[styles.heading, { color: colors.primary }]}>{t('experts.heading')}</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>{t('experts.subtitle')}</Text>
        <Pressable onPress={() => router.push('/assistant')} style={({ pressed }) => [styles.askBanner, { backgroundColor: colors.primary }, pressed && styles.buttonPressed]}>
          <View style={[styles.askIcon, { backgroundColor: colors.primaryForeground + '20' }]}><Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primaryForeground} /></View>
          <View style={styles.askCopy}><Text style={[styles.askTitle, { color: colors.primaryForeground }]}>{t('experts.ask')}</Text><Text style={[styles.askSub, { color: colors.accent }]}>{t('experts.reply')}</Text></View>
          <Ionicons name="arrow-forward" size={19} color={colors.primaryForeground} />
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
           {filters.map((filter) => <Pressable key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filterChip, { backgroundColor: activeFilter === filter ? colors.primary : colors.card, borderColor: activeFilter === filter ? colors.primary : colors.border }]}><Text style={[styles.filterText, { color: activeFilter === filter ? colors.primaryForeground : colors.mutedForeground }]}>{translateValue(filter)}</Text></Pressable>)}
        </ScrollView>
        <View style={styles.listHeader}><Text style={[styles.listTitle, { color: colors.foreground }]}>{t('experts.available', { count: filtered.length })}</Text><Ionicons name="options-outline" size={18} color={colors.mutedForeground} /></View>
        {filtered.map((expert) => (
          <View key={expert.name} style={[styles.expertCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.expertTop}>
              <View style={[styles.avatar, { backgroundColor: colors.secondary }]}><Text style={[styles.avatarText, { color: colors.primary }]}>{expert.initials}</Text><View style={[styles.onlineDot, { backgroundColor: expert.online ? '#3fbf5c' : colors.muted, borderColor: colors.card }]} /></View>
               <View style={styles.expertInfo}><View style={styles.nameRow}><Text style={[styles.expertName, { color: colors.foreground }]}>{expert.name}</Text><Ionicons name="checkmark-circle" size={17} color={colors.primary} /></View><Text style={[styles.expertRole, { color: colors.mutedForeground }]}>{translateValue(expert.role)}</Text><View style={styles.ratingRow}><Ionicons name="star" size={13} color="#e8a530" /><Text style={[styles.rating, { color: colors.warningForeground }]}>{expert.rating}</Text><Text style={[styles.reviews, { color: colors.mutedForeground }]}>· {expert.reviews} reviews</Text></View></View>
            </View>
            <View style={styles.expertActions}>
               <Pressable onPress={() => Alert.alert(t('experts.chatTitle', { name: expert.name }), t('experts.chatMessage'))} style={({ pressed }) => [styles.chatButton, { backgroundColor: colors.primary }, pressed && styles.buttonPressed]}><Ionicons name="chatbubble-outline" size={15} color={colors.primaryForeground} /><Text style={[styles.chatText, { color: colors.primaryForeground }]}>{t('experts.chat')}</Text></Pressable>
               <Pressable onPress={() => Alert.alert(t('experts.callTitle', { name: expert.name }), t('experts.callMessage'))} style={({ pressed }) => [styles.callButton, { borderColor: colors.primary }, pressed && styles.pressed]}><Ionicons name="call-outline" size={17} color={colors.primary} /></Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 22 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.7 },
  subheading: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 4 },
  askBanner: { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 17 },
  askIcon: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  askCopy: { flex: 1 },
  askTitle: { fontFamily: 'Inter_700Bold', fontSize: 14.5, marginBottom: 3 },
  askSub: { fontFamily: 'Inter_400Regular', fontSize: 12.5 },
  filterRow: { gap: 8, paddingBottom: 20 },
  filterChip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  filterText: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  listTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5 },
  expertCard: { borderWidth: 1, borderRadius: 17, padding: 15, marginBottom: 12 },
  expertTop: { flexDirection: 'row', gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  onlineDot: { position: 'absolute', width: 11, height: 11, borderRadius: 6, right: 0, bottom: 1, borderWidth: 2 },
  expertInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  expertName: { fontFamily: 'Inter_600SemiBold', fontSize: 14.5 },
  expertRole: { fontFamily: 'Inter_400Regular', fontSize: 12.5, marginTop: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  rating: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  reviews: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  expertActions: { flexDirection: 'row', gap: 9, marginTop: 14 },
  chatButton: { flex: 1, minHeight: 39, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  chatText: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5 },
  callButton: { width: 42, minHeight: 39, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});