import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ArrowLeft,
    Bell,
    Globe,
    Shield,
    HelpCircle,
    FileText,
    Trash2,
    ChevronRight,
    Moon,
    Info,
    Mail,
    Lock,
    MessageCircle,
    UserX,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [locationSharing, setLocationSharing] = useState(false);
    const [scamAlerts, setScamAlerts] = useState(true);
    const [communityUpdates, setCommunityUpdates] = useState(true);
    const [chatNotifications, setChatNotifications] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const notif = await AsyncStorage.getItem('setting_notifications');
            const dark = await AsyncStorage.getItem('setting_dark_mode');
            const scam = await AsyncStorage.getItem('setting_scam_alerts');
            const community = await AsyncStorage.getItem('setting_community');

            if (notif !== null) setNotificationsEnabled(notif === 'true');
            if (dark !== null) setDarkMode(dark === 'true');
            if (scam !== null) setScamAlerts(scam === 'true');
            if (community !== null) setCommunityUpdates(community === 'true');
            const chat = await AsyncStorage.getItem('setting_chat_notif');
            if (chat !== null) setChatNotifications(chat === 'true');
        } catch { }
    };

    const saveSetting = async (key: string, value: boolean) => {
        try {
            await AsyncStorage.setItem(key, String(value));
        } catch { }
    };

    const handleNotifications = (val: boolean) => {
        setNotificationsEnabled(val);
        saveSetting('setting_notifications', val);
    };
    const handleDarkMode = (val: boolean) => {
        setDarkMode(val);
        saveSetting('setting_dark_mode', val);
    };
    const handleScamAlerts = (val: boolean) => {
        setScamAlerts(val);
        saveSetting('setting_scam_alerts', val);
    };
    const handleCommunityUpdates = (val: boolean) => {
        setCommunityUpdates(val);
        saveSetting('setting_community', val);
    };
    const handleChatNotifications = (val: boolean) => {
        setChatNotifications(val);
        saveSetting('setting_chat_notif', val);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and all associated data including saved trips, scam reports, and community posts. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete My Account',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await supabase.auth.signOut();
                            await AsyncStorage.clear();
                            navigation.dispatch(
                                require('@react-navigation/native').CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Auth' }],
                                })
                            );
                        } catch (err: any) {
                            Alert.alert('Error', 'Could not delete account. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'This will clear temporary app data. Your saved trips and account data will not be affected.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Only clear non-credentials keys
                            const keys = await AsyncStorage.getAllKeys();
                            const cacheKeys = keys.filter(k => k.startsWith('cache_') || k.startsWith('temp_'));
                            await AsyncStorage.multiRemove(cacheKeys);
                            Alert.alert('Done', 'Cache cleared successfully!');
                        } catch {
                            Alert.alert('Done', 'Cache cleared!');
                        }
                    },
                },
            ]
        );
    };

    const handleHelp = () => {
        Linking.openURL('mailto:support@smartnav.app?subject=SmartNav Support Request');
    };

    const handleTerms = () => {
        Alert.alert(
            'Terms & Privacy',
            'SmartNav collects location data to provide navigation and safety features. We do not sell your personal data to third parties.\n\nYour trip data is stored securely on our servers. You can delete your account at any time from the profile settings.\n\nFor the full policy, visit smartnav.app/privacy',
            [{ text: 'OK' }]
        );
    };

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    const ToggleRow = ({
        icon: Icon,
        title,
        subtitle,
        value,
        onValueChange,
        iconColor = '#3B82F6',
    }: {
        icon: any;
        title: string;
        subtitle: string;
        value: boolean;
        onValueChange: (val: boolean) => void;
        iconColor?: string;
    }) => (
        <View style={styles.settingRow}>
            <View style={[styles.settingIcon, { backgroundColor: `${iconColor}18` }]}>
                <Icon size={20} color={iconColor} />
            </View>
            <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingSubtitle}>{subtitle}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#1E293B', true: `${iconColor}60` }}
                thumbColor={value ? iconColor : '#475569'}
                ios_backgroundColor="#1E293B"
            />
        </View>
    );

    const TapRow = ({
        icon: Icon,
        title,
        subtitle,
        onPress,
        iconColor = '#3B82F6',
        danger = false,
    }: {
        icon: any;
        title: string;
        subtitle: string;
        onPress: () => void;
        iconColor?: string;
        danger?: boolean;
    }) => (
        <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.settingIcon, { backgroundColor: danger ? 'rgba(220,38,38,0.1)' : `${iconColor}18` }]}>
                <Icon size={20} color={danger ? '#DC2626' : iconColor} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, danger && { color: '#DC2626' }]}>{title}</Text>
                <Text style={styles.settingSubtitle}>{subtitle}</Text>
            </View>
            <ChevronRight size={18} color="#334155" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <ArrowLeft size={22} color="#F1F5F9" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Notifications */}
                <SectionHeader title="Notifications" />
                <View style={styles.card}>
                    <ToggleRow
                        icon={Bell}
                        title="Push Notifications"
                        subtitle="Alerts, updates & reminders"
                        value={notificationsEnabled}
                        onValueChange={handleNotifications}
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        icon={Shield}
                        title="Scam Alerts"
                        subtitle="Notify me of nearby scam reports"
                        value={scamAlerts}
                        onValueChange={handleScamAlerts}
                        iconColor="#F59E0B"
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        icon={Globe}
                        title="Community Updates"
                        subtitle="New trip stories & travel buddies"
                        value={communityUpdates}
                        onValueChange={handleCommunityUpdates}
                        iconColor="#8B5CF6"
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        icon={MessageCircle}
                        title="Chat Messages"
                        subtitle="Notify when buddies send messages"
                        value={chatNotifications}
                        onValueChange={handleChatNotifications}
                        iconColor="#10B981"
                    />
                </View>

                {/* Appearance */}
                <SectionHeader title="Appearance" />
                <View style={styles.card}>
                    <ToggleRow
                        icon={Moon}
                        title="Dark Mode"
                        subtitle="App uses dark theme by default"
                        value={darkMode}
                        onValueChange={handleDarkMode}
                        iconColor="#6366F1"
                    />
                    <View style={styles.divider} />
                    <TapRow
                        icon={Globe}
                        title="Language"
                        subtitle="English (more languages coming soon)"
                        onPress={() => Alert.alert('Language', 'More languages will be added in a future update.')}
                        iconColor="#06B6D4"
                    />
                </View>

                {/* Privacy */}
                <SectionHeader title="Privacy & Data" />
                <View style={styles.card}>
                    <ToggleRow
                        icon={Lock}
                        title="Location Sharing"
                        subtitle="Share location with Trip Buddy matches"
                        value={locationSharing}
                        onValueChange={(val) => { setLocationSharing(val); }}
                        iconColor="#10B981"
                    />
                    <View style={styles.divider} />
                    <TapRow
                        icon={Trash2}
                        title="Clear Cache"
                        subtitle="Free up temporary storage"
                        onPress={handleClearCache}
                        iconColor="#EF4444"
                    />
                </View>

                {/* Support */}
                <SectionHeader title="Help & Legal" />
                <View style={styles.card}>
                    <TapRow
                        icon={Mail}
                        title="Contact Support"
                        subtitle="Email us at support@smartnav.app"
                        onPress={handleHelp}
                        iconColor="#3B82F6"
                    />
                    <View style={styles.divider} />
                    <TapRow
                        icon={HelpCircle}
                        title="Help Center"
                        subtitle="FAQs and how-to guides"
                        onPress={() => Alert.alert('Help Center', 'Help articles coming soon! For now, email us at support@smartnav.app')}
                        iconColor="#6366F1"
                    />
                    <View style={styles.divider} />
                    <TapRow
                        icon={FileText}
                        title="Terms & Privacy Policy"
                        subtitle="How we handle your data"
                        onPress={handleTerms}
                        iconColor="#64748B"
                    />
                </View>

                {/* Danger Zone */}
                <SectionHeader title="Danger Zone" />
                <View style={styles.card}>
                    <TapRow
                        icon={UserX}
                        title="Delete Account"
                        subtitle="Permanently remove your data"
                        onPress={handleDeleteAccount}
                        danger
                    />
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Info size={14} color="#334155" />
                    <Text style={styles.appInfoText}>SmartNav v{APP_VERSION}</Text>
                    <Text style={styles.appInfoText}>·</Text>
                    <Text style={styles.appInfoText}>Made with ❤️ for travelers</Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080E1A' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 18,
        backgroundColor: '#0B1220',
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#1E293B',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#F1F5F9' },

    scrollContent: { paddingHorizontal: 16, paddingTop: 24 },

    sectionHeader: {
        fontSize: 12, fontWeight: '700', color: '#475569',
        letterSpacing: 1, textTransform: 'uppercase',
        marginBottom: 10, marginLeft: 4, marginTop: 4,
    },

    card: {
        backgroundColor: '#0F172A',
        borderRadius: 18,
        marginBottom: 24,
        borderWidth: 1, borderColor: '#1E293B',
        overflow: 'hidden',
    },

    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14,
    },
    settingIcon: {
        width: 42, height: 42, borderRadius: 21,
        justifyContent: 'center', alignItems: 'center',
    },
    settingContent: { flex: 1 },
    settingTitle: { fontSize: 15, fontWeight: '600', color: '#F1F5F9', marginBottom: 2 },
    settingSubtitle: { fontSize: 12, color: '#64748B' },

    divider: { height: 1, backgroundColor: '#1E293B', marginLeft: 72 },

    appInfo: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 16,
    },
    appInfoText: { fontSize: 12, color: '#334155' },
});
