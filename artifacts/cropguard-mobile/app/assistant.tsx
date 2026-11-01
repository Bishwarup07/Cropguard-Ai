import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Message = { id: string; text: string; sender: 'user' | 'assistant' };

export default function AssistantScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [input, setInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I am your CropGuard AI Assistant. I can read my responses out loud for you. You can type or use the new Microphone button to talk to me!",
      sender: 'assistant'
    }
  ]);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
        stopSpeaking();
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setRecording(null);
    setIsTranscribing(true);
    await recording.stopAndUnloadAsync();
    
    // Simulate AI transcription process
    setTimeout(() => {
      setIsTranscribing(false);
      handleMockVoiceInput("Is there any risk of blight based on the current weather?");
    }, 1500);
  };

  const handleMockVoiceInput = (transcribedText: string) => {
    const userMessage: Message = { id: Date.now().toString(), text: transcribedText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    generateAiResponse(userMessage.text);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), text: input.trim(), sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    stopSpeaking();
    generateAiResponse(userMessage.text);
  };

  const generateAiResponse = (text: string) => {
    setTimeout(() => {
      let aiResponse = "I'm sorry, I didn't quite catch that. Could you ask about your crops, weather, or soil?";
      const lower = text.toLowerCase();
      if (lower.includes('weather') || lower.includes('rain')) {
        aiResponse = "The weather looks partly cloudy with a 0% chance of rain today. It's a great time to check your soil moisture!";
      } else if (lower.includes('disease') || lower.includes('sick') || lower.includes('blight')) {
        aiResponse = "If you suspect a crop disease, you can use the Scan feature in the app to take a photo. I will analyze it and tell you exactly what's wrong.";
      } else if (lower.includes('hello') || lower.includes('hi')) {
        aiResponse = "Hello there! Let me know if you need any farming advice today.";
      } else if (lower.includes('fertilizer') || lower.includes('soil')) {
        aiResponse = "For optimal soil health, make sure to test your pH levels. Most crops prefer a pH between 6.0 and 7.0.";
      }

      const assistantMessage: Message = { id: (Date.now() + 1).toString(), text: aiResponse, sender: 'assistant' };
      setMessages(prev => [...prev, assistantMessage]);

      setIsSpeaking(true);
      Speech.speak(aiResponse, {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        rate: 0.95,
      });
    }, 1000);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => { stopSpeaking(); router.back(); }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Voice Assistant</Text>
        <Pressable onPress={stopSpeaking} style={styles.stopButton}>
          {isSpeaking && <Ionicons name="volume-mute" size={24} color={colors.destructive} />}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.chatContainer} showsVerticalScrollIndicator={false}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.bubble, msg.sender === 'user' ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.assistantBubble, { backgroundColor: colors.secondary }]]}>
            <Text style={[styles.bubbleText, msg.sender === 'user' ? { color: colors.primaryForeground } : { color: colors.secondaryForeground }]}>{msg.text}</Text>
          </View>
        ))}
        {isTranscribing && (
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginLeft: 8 }}>
            <Ionicons name="mic" size={16} color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Transcribing your voice...</Text>
          </View>
        )}
        {isSpeaking && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginLeft: 8 }}>
            <Ionicons name="volume-medium" size={16} color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Speaking...</Text>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 10 : 0}>
        <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.card, paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            placeholder="Type or speak a question..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          {input.trim() ? (
            <Pressable onPress={handleSend} style={({ pressed }) => [styles.sendButton, { backgroundColor: colors.primary }, pressed && { opacity: 0.8 }]}>
              <Ionicons name="send" size={18} color={colors.primaryForeground} />
            </Pressable>
          ) : (
            <Pressable 
              onPressIn={startRecording} 
              onPressOut={stopRecording} 
              style={({ pressed }) => [
                styles.micButton, 
                { backgroundColor: recording ? colors.destructive : colors.secondary },
                pressed && { opacity: 0.8 }
              ]}
            >
              <Ionicons name="mic" size={20} color={recording ? '#fff' : colors.foreground} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  backButton: { padding: 4 },
  stopButton: { padding: 4, width: 32 },
  chatContainer: { padding: 16, gap: 12, paddingBottom: 40 },
  bubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, gap: 10 },
  input: { flex: 1, minHeight: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, fontFamily: 'Inter_400Regular', fontSize: 15 },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  micButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
