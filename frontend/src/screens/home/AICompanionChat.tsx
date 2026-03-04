import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Animated,
    Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
    ArrowLeft,
    Send,
    Bot,
    User,
    Sparkles,
    MapPin,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

const API_URL = 'https://smartnav-mobile-app.onrender.com/api';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const SUGGESTIONS = [
    "Is it safe to travel solo here?",
    "Best food spots nearby?",
    "Any scams I should know about?",
    "What's the best time to visit?",
    "Budget tips for this area?",
    "Local customs I should know?",
];

const WELCOME_MSG: ChatMessage = {
    id: '0',
    role: 'assistant',
    content: "Hey! 👋 I'm your SmartNav AI companion. Ask me anything about travel — safety tips, local spots, budget advice, or just chat about your trip! I have context about your location and nearby safety reports.",
    timestamp: new Date(),
};

// Module-level chat cache — survives navigation but clears on full app restart
let cachedMessages: ChatMessage[] = [WELCOME_MSG];

export default function AICompanionChat() {
    const navigation = useNavigation<any>();
    const [messages, setMessages] = useState<ChatMessage[]>(cachedMessages);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [locationName, setLocationName] = useState('');
    const [nearbyScams, setNearbyScams] = useState(0);
    const [weather, setWeather] = useState('');
    const [tripCount, setTripCount] = useState(0);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const flatRef = useRef<FlatList>(null);
    const dotAnim = useRef(new Animated.Value(0)).current;

    // Sync messages to module cache so they persist across navigations
    useEffect(() => {
        cachedMessages = messages;
    }, [messages]);

    useEffect(() => {
        const kShow = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
        const kHide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));

        loadContext();
        // Scroll to end on mount if there are previous messages
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 300);

        return () => {
            kShow.remove();
            kHide.remove();
        };
    }, []);

    useEffect(() => {
        if (loading) {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(dotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(dotAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                ])
            );
            loop.start();
            return () => loop.stop();
        }
    }, [loading]);

    const loadContext = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({});
                const geo = await Location.reverseGeocodeAsync({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                });
                if (geo[0]) {
                    setLocationName(`${geo[0].district || geo[0].city || ''}, ${geo[0].region || geo[0].country || ''}`);
                }

                // Weather
                try {
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}&current_weather=true`);
                    const data = await res.json();
                    if (data?.current_weather) {
                        setWeather(`${Math.round(data.current_weather.temperature)}°C`);
                    }
                } catch { }

                // Scam count
                try {
                    const { data } = await supabase.from('scam_reports').select('id,lat,lon').limit(100);
                    const nearby = (data || []).filter((r: any) => {
                        const dLat = (r.lat - loc.coords.latitude) * 111;
                        const dLon = (r.lon - loc.coords.longitude) * 111 * Math.cos((loc.coords.latitude * Math.PI) / 180);
                        return Math.sqrt(dLat * dLat + dLon * dLon) <= 5;
                    });
                    setNearbyScams(nearby.length);
                } catch { }
            }

            // Trip count
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                try {
                    const { getSavedTrips } = await import('../../services/tripService');
                    const trips = await getSavedTrips(user.id);
                    setTripCount(trips.length);
                } catch { }
            }
        } catch { }
    };

    const sendMessage = async (text?: string) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Keyboard.dismiss();

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: msg,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const res = await fetch(`${API_URL}/ai/companion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msg,
                    context: {
                        location: locationName || undefined,
                        weather: weather || undefined,
                        nearbyScams: nearbyScams > 0 ? nearbyScams : undefined,
                        savedTrips: tripCount > 0 ? tripCount : undefined,
                    },
                }),
            });

            const data = await res.json();

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            const assistantMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply || "I'm having trouble connecting. Please try again!",
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: "Oops! I couldn't reach the server right now. Make sure the backend is running and try again. 📡",
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
        }
    };

    const handleSuggestion = (suggestion: string) => {
        Haptics.selectionAsync();
        sendMessage(suggestion);
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.role === 'user';
        return (
            <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
                {!isUser && (
                    <View style={styles.avatarBot}>
                        <Bot size={16} color="#3B82F6" />
                    </View>
                )}
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                    <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.content}</Text>
                </View>
                {isUser && (
                    <View style={styles.avatarUser}>
                        <User size={14} color="#FFF" />
                    </View>
                )}
            </View>
        );
    };

    const showSuggestions = messages.length <= 1;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior="padding"
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => { Haptics.selectionAsync(); navigation.goBack(); }}>
                    <ArrowLeft size={20} color="#F1F5F9" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.headerDot} />
                    <Text style={styles.headerTitle}>SmartNav AI</Text>
                </View>
                {locationName ? (
                    <View style={styles.headerLocation}>
                        <MapPin size={10} color="#64748B" />
                        <Text style={styles.headerLocationText} numberOfLines={1}>{locationName}</Text>
                    </View>
                ) : <View style={{ width: 40 }} />}
            </View>

            {/* Messages */}
            <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
                ListFooterComponent={
                    <>
                        {loading && (
                            <View style={styles.typingRow}>
                                <View style={styles.avatarBot}>
                                    <Bot size={16} color="#3B82F6" />
                                </View>
                                <View style={styles.typingBubble}>
                                    <Animated.View style={[styles.typingDot, { opacity: dotAnim }]} />
                                    <Animated.View style={[styles.typingDot, { opacity: dotAnim, transform: [{ scale: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }]} />
                                    <Animated.View style={[styles.typingDot, { opacity: dotAnim }]} />
                                </View>
                            </View>
                        )}
                        {showSuggestions && (
                            <View style={styles.suggestionsWrap}>
                                <View style={styles.suggestionsHeader}>
                                    <Sparkles size={14} color="#F59E0B" />
                                    <Text style={styles.suggestionsTitle}>Try asking…</Text>
                                </View>
                                {SUGGESTIONS.map((s, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.suggestionPill}
                                        onPress={() => handleSuggestion(s)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.suggestionText}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                }
            />

            {/* Input */}
            <View style={[styles.inputBar, { paddingBottom: Platform.OS === 'ios' && !isKeyboardVisible ? 34 : 12 }]}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Ask me anything about travel…"
                    placeholderTextColor="#334155"
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={() => sendMessage()}
                    returnKeyType="send"
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                    onPress={() => sendMessage()}
                    disabled={!input.trim() || loading}
                >
                    {loading ? (
                        <ActivityIndicator size={16} color="#FFF" />
                    ) : (
                        <Send size={18} color="#FFF" />
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#060C18' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16,
        backgroundColor: '#0A1020',
        borderBottomWidth: 1, borderBottomColor: '#1E293B',
        gap: 10,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#1E293B',
        justifyContent: 'center', alignItems: 'center',
    },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    headerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#F1F5F9' },
    headerLocation: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        maxWidth: 120, backgroundColor: '#111827',
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    },
    headerLocationText: { fontSize: 10, color: '#64748B' },

    messagesContainer: { padding: 16, paddingBottom: 20 },

    msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, gap: 8 },
    msgRowUser: { flexDirection: 'row', justifyContent: 'flex-end' },

    avatarBot: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: 'rgba(59,130,246,0.15)',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 2,
    },
    avatarUser: {
        width: 26, height: 26, borderRadius: 13,
        backgroundColor: '#2563EB',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 2,
    },

    bubble: { maxWidth: '75%', borderRadius: 20, padding: 14, paddingHorizontal: 16 },
    bubbleBot: {
        backgroundColor: '#111827',
        borderBottomLeftRadius: 6,
        borderWidth: 1, borderColor: '#1E293B',
    },
    bubbleUser: {
        backgroundColor: '#1D4ED8',
        borderBottomRightRadius: 6,
    },
    bubbleText: { fontSize: 14, color: '#CBD5E1', lineHeight: 21 },
    bubbleTextUser: { color: '#F1F5F9' },

    typingRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, gap: 8 },
    typingBubble: {
        flexDirection: 'row', gap: 5,
        backgroundColor: '#111827', borderRadius: 20,
        padding: 14, borderWidth: 1, borderColor: '#1E293B',
    },
    typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3B82F6' },

    suggestionsWrap: { marginTop: 8, gap: 8 },
    suggestionsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    suggestionsTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
    suggestionPill: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
    },
    suggestionText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },

    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 12, paddingVertical: 12,
        backgroundColor: '#0A1020',
        borderTopWidth: 1, borderTopColor: '#1E293B',
        gap: 10,
    },
    textInput: {
        flex: 1, backgroundColor: '#111827',
        borderRadius: 24, paddingHorizontal: 18,
        paddingVertical: 12, fontSize: 14,
        color: '#F1F5F9', maxHeight: 100,
        borderWidth: 1, borderColor: '#1E293B',
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#2563EB',
        justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { backgroundColor: '#1E293B' },
});
