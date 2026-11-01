import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { useColors } from '@/hooks/useColors';
import { detectCropDisease } from '@/lib/diseaseDetection';

function Corner({ position }: { position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' }) {
  return <View style={[styles.corner, styles[position]]} />;
}

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashOn, setFlashOn] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { addScan } = useApp();
  const { t } = useLanguage();
  const router = useRouter();

  const completeScan = async (imageUri?: string) => {
    const detection = await detectCropDisease(imageUri);
    addScan({
      crop: 'Current field',
      finding: detection.disease,
      severity: detection.severity,
      location: 'Latest scan · just now',
      imageUri,
      confidence: detection.confidence,
      treatment: detection.medicine,
    });
    setAnalyzing(false);
    router.replace({
      pathname: '/scan-result',
      params: {
        imageUri: imageUri ?? '',
        disease: detection.disease,
        confidence: String(detection.confidence),
        severity: detection.severity,
        medicine: detection.medicine,
        fertilizer: detection.fertilizer,
        prevention: detection.prevention,
        usage: detection.usage,
        inferenceMode: detection.mode,
      },
    });
  };

  const capture = async () => {
    if (Platform.OS === 'web') {
      setAnalyzing(true);
      setTimeout(() => { void completeScan(); }, 900);
      return;
    }
    setAnalyzing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.75 });
      await completeScan(photo?.uri);
    } catch {
      setAnalyzing(false);
      Alert.alert(t('scan.captureError'), t('scan.captureErrorMessage'));
    }
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setAnalyzing(true);
      setTimeout(() => { void completeScan(result.assets[0]?.uri); }, 900);
    }
  };

  if (!permission) {
    return <View style={[styles.permission, { backgroundColor: colors.background }]}><Text style={{ color: colors.mutedForeground }}>{t('scan.preparing')}</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.permission, { backgroundColor: colors.background, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.permissionIcon, { backgroundColor: colors.secondary }]}>
          <Ionicons name="camera-outline" size={34} color={colors.primary} />
        </View>
        <Text style={[styles.permissionTitle, { color: colors.foreground }]}>{t('scan.cameraTitle')}</Text>
        <Text style={[styles.permissionText, { color: colors.mutedForeground }]}>{t('scan.cameraText')}</Text>
        <Pressable
          testID="request-camera-button"
          accessibilityRole="button"
          onPress={permission.canAskAgain ? requestPermission : undefined}
          style={({ pressed }) => [styles.primaryAction, { backgroundColor: colors.primary }, pressed && styles.buttonPressed]}
        >
          <Ionicons name="camera" size={19} color={colors.primaryForeground} />
          <Text style={[styles.primaryActionText, { color: colors.primaryForeground }]}>{permission.canAskAgain ? t('scan.allowCamera') : t('scan.deviceSettings')}</Text>
        </Pressable>
        {permission.canAskAgain === false && Platform.OS !== 'web' ? (
          <Text style={[styles.settingsHint, { color: colors.mutedForeground }]}>{t('scan.settingsHint')}</Text>
        ) : null}
        <Pressable onPress={openGallery} style={styles.galleryFallback}>
          <Ionicons name="images-outline" size={17} color={colors.primary} />
          <Text style={[styles.galleryFallbackText, { color: colors.primary }]}>{t('scan.choosePhoto')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.cameraScreen}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary }]}>
          <View style={[styles.webCameraTexture, { backgroundColor: colors.primary }]} />
        </View>
      ) : (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" enableTorch={flashOn} />
      )}
      <View style={[styles.cameraShade, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 92 }]}>
        <View style={styles.cameraTop}>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{t('scan.active')}</Text>
          </View>
        </View>
        <View style={styles.viewfinder}>
          <Corner position="topLeft" />
          <Corner position="topRight" />
          <Corner position="bottomLeft" />
          <Corner position="bottomRight" />
          <View style={styles.centerTarget}><View style={styles.centerDot} /></View>
        </View>
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>{analyzing ? t('scan.analyzing') : t('scan.align')}</Text>
          <Text style={styles.instructionSub}>{t('scan.lighting')}</Text>
        </View>
        <View style={styles.cameraControls}>
          <Pressable accessibilityLabel={t('scan.toggleFlash')} onPress={() => setFlashOn((value) => !value)} style={({ pressed }) => [styles.controlButton, flashOn && styles.controlSelected, pressed && styles.pressed]}>
            <Ionicons name={flashOn ? 'flash' : 'flash-outline'} size={21} color="#ffffff" />
          </Pressable>
          <Pressable testID="capture-button" accessibilityLabel={t('scan.capture')} onPress={capture} disabled={analyzing} style={({ pressed }) => [styles.shutterOuter, pressed && styles.shutterPressed]}>
            <View style={styles.shutterInner} />
          </Pressable>
          <Pressable accessibilityLabel={t('scan.gallery')} onPress={openGallery} style={({ pressed }) => [styles.controlButton, pressed && styles.pressed]}>
            <Ionicons name="images-outline" size={21} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraScreen: { flex: 1, backgroundColor: '#1c3b1e' },
  cameraShade: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', alignItems: 'center' },
  webCameraTexture: { ...StyleSheet.absoluteFillObject, opacity: 0.88 },
  cameraTop: { alignItems: 'center' },
  livePill: { backgroundColor: 'rgba(20,20,18,0.58)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#7bf28a' },
  liveText: { color: '#ffffff', fontFamily: 'Inter_600SemiBold', fontSize: 13.5 },
  viewfinder: { width: '76%', aspectRatio: 0.84, maxWidth: 340, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 38, height: 38, borderColor: '#7bf28a', borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  centerTarget: { width: 8, height: 8, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.75)' },
  centerDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#1c3b1e' },
  instructions: { alignItems: 'center', paddingHorizontal: 20 },
  instructionTitle: { color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 8 },
  instructionSub: { color: 'rgba(255,255,255,0.88)', fontFamily: 'Inter_400Regular', fontSize: 13.5, marginTop: 5, textAlign: 'center' },
  cameraControls: { width: '100%', paddingHorizontal: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  controlButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  controlSelected: { backgroundColor: 'rgba(255,255,255,0.55)' },
  shutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 63, height: 63, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(20,20,18,0.12)' },
  shutterPressed: { transform: [{ scale: 0.94 }] },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  permissionIcon: { width: 82, height: 82, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  permissionTitle: { fontFamily: 'Inter_700Bold', fontSize: 25, textAlign: 'center', letterSpacing: -0.5, lineHeight: 31 },
  permissionText: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, maxWidth: 330 },
  primaryAction: { marginTop: 26, minHeight: 52, borderRadius: 15, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryActionText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  settingsHint: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 12, textAlign: 'center' },
  galleryFallback: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 7, padding: 8 },
  galleryFallbackText: { fontFamily: 'Inter_600SemiBold', fontSize: 13.5 },
  pressed: { opacity: 0.7 },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
});