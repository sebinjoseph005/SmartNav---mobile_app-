import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, MapPin, Calendar, Users } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    time: string;
}

export default function BuddyChatScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { buddy } = route.params || {};

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [myName, setMyName] = useState('Traveler');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadUser();
        if (buddy?.chat_messages) {
            setMessages(buddy.chat_messages);
        }
        // Poll for new messages every 5 seconds
        const interval = setInterval(refreshMessages, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setMyName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Traveler');
    };

    const refreshMessages = async () => {
        if (!buddy?.id) return;
        const { data } = await supabase.from('trip_buddies').select('chat_messages').eq('id', buddy.id).single();
        if (data?.chat_messages) setMessages(data.chat_messages);
    };

    const sendMessage = async () => {
        if (!input.trim() || sending) return;
        const text = input.trim();
        setInput('');

        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: myName,
            text,
            time: new Date().toISOString(),
        };

        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);

        try {
            setSending(true);
            const { error } = await supabase
                .from('trip_buddies')
                .update({ chat_messages: updatedMessages })
                .eq('id', buddy.id);
            if (error) throw error;
        } catch (err: any) {
            Alert.alert('Error', 'Could not send message.');
            setMessages(messages); // revert
        } finally {
            setSending(false);
        }
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch { return ''; }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isMe = item.sender === myName;
        return (
            <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && (
                    <View style={styles.msgAvatar}>
                        <Text style={styles.msgAvatarText}>{item.sender?.[0]?.toUpperCase() || '?'}</Text>
                    </View>
                )}
                <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
                    {!isMe && <Text style={styles.msgSender}>{item.sender}</Text>}
                    <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
                    <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{formatTime(item.time)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with trip info */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#fff" size={22} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <View style={styles.tripDestRow}>
                        <MapPin size={13} color="#2563EB" />
                        <Text style={styles.tripDest}>{buddy?.destination}</Text>
                    </View>
                    <Text style={styles.tripMeta}>{buddy?.travel_date} · {buddy?.spots_left} spots</Text>
                </View>
            </View>

            {/* Trip description banner */}
            <View style={styles.descBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Users size={14} color="#2563EB" />
                    <Text style={styles.descAuthor}>Posted by {buddy?.author_name}</Text>
                </View>
                <Text style={styles.descText} numberOfLines={2}>{buddy?.description}</Text>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                ListEmptyComponent={
                    <View style={styles.emptyChat}>
                        <Text style={styles.emptyChatText}>No messages yet. Say hello! 👋</Text>
                    </View>
                }
                onLayout={() => messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: false })}
            />

            {/* Input */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Type a message…"
                        placeholderTextColor="#4B5563"
                        value={input}
                        onChangeText={setInput}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
                        onPress={sendMessage}
                        disabled={!input.trim() || sending}
                    >
                        {sending
                            ? <ActivityIndicator size={18} color="#fff" />
                            : <Send size={18} color="#fff" />
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080E1A' },

    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#1E293B',
    },
    backBtn: { padding: 4 },
    tripDestRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    tripDest: { color: '#fff', fontSize: 15, fontWeight: '700' },
    tripMeta: { color: '#64748B', fontSize: 12, marginTop: 2 },

    descBanner: {
        backgroundColor: '#0D1930', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1E293B',
    },
    descAuthor: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
    descText: { color: '#94A3B8', fontSize: 13 },

    messageList: { padding: 14, gap: 12, paddingBottom: 20 },

    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 },
    msgRowMe: { flexDirection: 'row-reverse' },

    msgAvatar: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563EB',
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    msgAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    msgBubble: {
        maxWidth: '75%', backgroundColor: '#1E293B',
        padding: 12, borderRadius: 18, borderBottomLeftRadius: 4,
    },
    msgBubbleMe: { backgroundColor: '#2563EB', borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
    msgSender: { color: '#64748B', fontSize: 11, fontWeight: '600', marginBottom: 3 },
    msgText: { color: '#F1F5F9', fontSize: 14, lineHeight: 20 },
    msgTextMe: { color: '#fff' },
    msgTime: { color: '#64748B', fontSize: 10, marginTop: 4, textAlign: 'right' },
    msgTimeMe: { color: 'rgba(255,255,255,0.6)' },

    emptyChat: { alignItems: 'center', paddingTop: 40 },
    emptyChatText: { color: '#4B5563', fontSize: 14 },

    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 10,
        paddingHorizontal: 14, paddingVertical: 12,
        borderTopWidth: 1, borderTopColor: '#1E293B',
        backgroundColor: '#0B1220',
    },
    textInput: {
        flex: 1, backgroundColor: '#111827', borderRadius: 22,
        paddingHorizontal: 16, paddingVertical: 12,
        color: '#fff', fontSize: 14, maxHeight: 100,
        borderWidth: 1, borderColor: '#1E293B',
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563EB',
        justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { backgroundColor: '#1E40AF', opacity: 0.5 },
});
