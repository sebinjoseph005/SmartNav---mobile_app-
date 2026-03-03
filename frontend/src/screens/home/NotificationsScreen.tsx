import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Bell,
    AlertTriangle,
    MessageCircle,
    MapPin,
    Shield,
    CheckCheck,
    Trash2,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../services/supabase';

interface Notification {
    id: string;
    type: 'scam' | 'message' | 'trip' | 'safety' | 'system';
    title: string;
    body: string;
    time: string;
    read: boolean;
}

const STORAGE_KEY = 'smartnav_notifications';
const READ_KEY = 'smartnav_read_notifications';

export default function NotificationsScreen() {
    const navigation = useNavigation<any>();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [readIds, setReadIds] = useState<string[]>([]);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }, [])
    );

    const loadNotifications = async () => {
        try {
            // Load read state
            const readStr = await AsyncStorage.getItem(READ_KEY);
            const readList = readStr ? JSON.parse(readStr) : [];
            setReadIds(readList);

            // Build notifications from real data
            const notifs: Notification[] = [];

            // Check for nearby scam reports
            try {
                const { data: scams } = await supabase
                    .from('scam_reports')
                    .select('id, scam_type, description, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5);

                (scams || []).forEach((s: any) => {
                    notifs.push({
                        id: `scam_${s.id}`,
                        type: 'scam',
                        title: `⚠️ ${s.scam_type} Alert`,
                        body: s.description?.slice(0, 80) + '...' || 'A scam was reported nearby',
                        time: s.created_at,
                        read: readList.includes(`scam_${s.id}`),
                    });
                });
            } catch { }

            // Check for buddy chat messages
            try {
                const { data: buddies } = await supabase
                    .from('trip_buddies')
                    .select('id, destination, chat_messages, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5);

                (buddies || []).forEach((b: any) => {
                    const msgs = b.chat_messages || [];
                    if (msgs.length > 0) {
                        const lastMsg = msgs[msgs.length - 1];
                        notifs.push({
                            id: `msg_${b.id}_${msgs.length}`,
                            type: 'message',
                            title: `💬 New message in ${b.destination}`,
                            body: `${lastMsg.sender}: ${lastMsg.text?.slice(0, 60) || ''}`,
                            time: lastMsg.time || b.created_at,
                            read: readList.includes(`msg_${b.id}_${msgs.length}`),
                        });
                    }
                });
            } catch { }

            // Check for new trip stories
            try {
                const { data: stories } = await supabase
                    .from('trip_stories')
                    .select('id, title, destination, author_name, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5);

                (stories || []).forEach((s: any) => {
                    notifs.push({
                        id: `story_${s.id}`,
                        type: 'trip',
                        title: `📖 New story: ${s.destination}`,
                        body: `${s.author_name} shared "${s.title}"`,
                        time: s.created_at,
                        read: readList.includes(`story_${s.id}`),
                    });
                });
            } catch { }

            // Safety tip notification
            notifs.push({
                id: 'safety_tip',
                type: 'safety',
                title: '🛡️ Safety Tip',
                body: 'Always check SafeHaven before visiting unfamiliar areas.',
                time: new Date(Date.now() - 3600000).toISOString(),
                read: readList.includes('safety_tip'),
            });

            // Add system welcome notification
            notifs.push({
                id: 'system_welcome',
                type: 'system',
                title: '🎉 Welcome to SmartNav!',
                body: 'Start planning your trips and stay safe on the go.',
                time: new Date(Date.now() - 86400000).toISOString(),
                read: readList.includes('system_welcome'),
            });

            // Sort by time
            notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            setNotifications(notifs);
        } catch (e) {
            console.error('Error loading notifications:', e);
        }
    };

    const markAsRead = async (id: string) => {
        const newReadIds = [...readIds, id];
        setReadIds(newReadIds);
        await AsyncStorage.setItem(READ_KEY, JSON.stringify(newReadIds));
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = async () => {
        const allIds = notifications.map(n => n.id);
        setReadIds(allIds);
        await AsyncStorage.setItem(READ_KEY, JSON.stringify(allIds));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = async () => {
        setNotifications([]);
        await AsyncStorage.removeItem(STORAGE_KEY);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'scam': return <AlertTriangle size={18} color="#F59E0B" />;
            case 'message': return <MessageCircle size={18} color="#3B82F6" />;
            case 'trip': return <MapPin size={18} color="#10B981" />;
            case 'safety': return <Shield size={18} color="#EF4444" />;
            default: return <Bell size={18} color="#8B5CF6" />;
        }
    };

    const getIconBg = (type: string) => {
        switch (type) {
            case 'scam': return 'rgba(245,158,11,0.15)';
            case 'message': return 'rgba(59,130,246,0.15)';
            case 'trip': return 'rgba(16,185,129,0.15)';
            case 'safety': return 'rgba(239,68,68,0.15)';
            default: return 'rgba(139,92,246,0.15)';
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.notifCard, !item.read && styles.notifCardUnread]}
            onPress={() => markAsRead(item.id)}
            activeOpacity={0.8}
        >
            <View style={[styles.notifIcon, { backgroundColor: getIconBg(item.type) }]}>
                {getIcon(item.type)}
            </View>
            <View style={styles.notifContent}>
                <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.notifTime}>{timeAgo(item.time)}</Text>
                </View>
                <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft size={22} color="#F1F5F9" />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        {unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.headerActions}>
                        {unreadCount > 0 && (
                            <TouchableOpacity onPress={markAllRead} style={styles.headerAction}>
                                <CheckCheck size={18} color="#3B82F6" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={clearAll} style={styles.headerAction}>
                            <Trash2 size={18} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Notification List */}
                <FlatList
                    data={notifications}
                    keyExtractor={item => item.id}
                    renderItem={renderNotification}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Bell size={48} color="#1E293B" />
                            </View>
                            <Text style={styles.emptyTitle}>All caught up!</Text>
                            <Text style={styles.emptySubtitle}>
                                No notifications right now.{'\n'}We'll let you know when something happens.
                            </Text>
                        </View>
                    }
                />
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080E1A' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    backBtn: { padding: 6, marginRight: 8 },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
    unreadBadge: {
        backgroundColor: '#2563EB',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 22,
        alignItems: 'center',
    },
    unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerAction: {
        padding: 8,
        backgroundColor: '#111827',
        borderRadius: 10,
    },

    list: { padding: 14, gap: 10, paddingBottom: 100 },

    notifCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    notifCardUnread: {
        backgroundColor: '#0F1A2E',
        borderColor: '#1E3A5F',
    },
    notifIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    notifContent: { flex: 1, gap: 4 },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notifTitle: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    notifTitleUnread: { color: '#F1F5F9' },
    notifTime: { color: '#475569', fontSize: 11, marginLeft: 8 },
    notifBody: { color: '#64748B', fontSize: 13, lineHeight: 18 },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2563EB',
        marginTop: 6,
    },

    emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyTitle: { color: '#F1F5F9', fontSize: 20, fontWeight: '700' },
    emptySubtitle: { color: '#64748B', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
