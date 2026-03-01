import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  User,
  Edit3,
  Settings,
  ChevronRight,
  BookMarked,
  MapPin,
  Globe,
  Star,
  Award,
  Calendar,
  LogOut,
  Bell,
  Shield,
  Compass,
  HelpCircle,
  FileText,
} from 'lucide-react-native';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { getSavedTrips } from '../../services/tripService';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tripCount, setTripCount] = useState(0);
  const [joinDate, setJoinDate] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => { loadUserData(); }, []);
  useFocusEffect(useCallback(() => { loadUserData(); }, []));

  const loadUserData = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
      if (data?.user) {
        // Join date
        const created = new Date(data.user.created_at);
        setJoinDate(created.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        // Load trips for stats
        try {
          const trips = await getSavedTrips(data.user.id);
          setTripCount(trips.length);
          // Extract interests from trips
          const allInterests = trips.flatMap((t: any) => t.interests || []);
          const unique = [...new Set(allInterests)] as string[];
          setInterests(unique.slice(0, 6));
        } catch { }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Auth' }] }));
        },
      },
    ]);
  };

  const fullName = user?.user_metadata?.full_name || 'Traveler';
  const email = user?.email || 'No email';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const menuItems = [
    {
      section: 'My Travel',
      items: [
        {
          icon: BookMarked, label: 'Saved Trips', sub: `${tripCount} itinerar${tripCount !== 1 ? 'ies' : 'y'} saved`,
          color: '#7C3AED', onPress: () => navigation.navigate('SavedTrips'),
        },
        {
          icon: Compass, label: 'My Places', sub: 'Saved locations & favourites',
          color: '#0891B2', onPress: () => navigation.navigate('SavedTrips'),
        },
      ],
    },
    {
      section: 'Account',
      items: [
        {
          icon: Settings, label: 'Settings', sub: 'Notifications, privacy & more',
          color: '#64748B', onPress: () => navigation.navigate('AppSettings'),
        },
        {
          icon: Bell, label: 'Notifications', sub: 'Manage your alerts',
          color: '#F59E0B', onPress: () => navigation.navigate('AppSettings'),
        },
        {
          icon: Shield, label: 'Safety History', sub: 'Your scam reports & alerts',
          color: '#10B981', onPress: () => navigation.navigate('Safety', { screen: 'ScamAlert' }),
        },
      ],
    },
    {
      section: 'Help',
      items: [
        {
          icon: HelpCircle, label: 'Help & Support', sub: 'Contact us anytime',
          color: '#3B82F6', onPress: () => navigation.navigate('AppSettings'),
        },
        {
          icon: FileText, label: 'Terms & Privacy', sub: 'How we keep your data safe',
          color: '#475569', onPress: () => Alert.alert('Terms & Privacy', 'SmartNav is committed to your privacy. We do not sell your data and you can delete your account at any time.'),
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => navigation.navigate('AppSettings')}>
            <Settings size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* PROFILE HERO CARD */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarGradientRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn} onPress={() => navigation.navigate('EditProfile')}>
              <Edit3 size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{email}</Text>

          {joinDate ? (
            <View style={styles.joinRow}>
              <Calendar size={12} color="#64748B" />
              <Text style={styles.joinText}>Member since {joinDate}</Text>
            </View>
          ) : null}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{tripCount}</Text>
              <Text style={styles.statLabel}>Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{Math.max(1, tripCount)}</Text>
              <Text style={styles.statLabel}>Destinations</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Star size={16} color="#F59E0B" />
              <Text style={styles.statLabel}>Explorer</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Edit3 size={15} color="#3B82F6" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* INTERESTS / BADGES */}
        {interests.length > 0 && (
          <View style={styles.interestsCard}>
            <View style={styles.interestsHeader}>
              <Award size={16} color="#F59E0B" />
              <Text style={styles.interestsTitle}>Your Travel Interests</Text>
            </View>
            <View style={styles.chips}>
              {interests.map((tag, i) => (
                <View key={i} style={styles.chip}>
                  <Text style={styles.chipText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* MENU SECTIONS */}
        {menuItems.map((section, si) => (
          <View key={si} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.section}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <React.Fragment key={idx}>
                  <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.7}>
                    <View style={[styles.menuIcon, { backgroundColor: `${item.color}18` }]}>
                      <item.icon size={20} color={item.color} />
                    </View>
                    <View style={styles.menuContent}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Text style={styles.menuSub}>{item.sub}</Text>
                    </View>
                    <ChevronRight size={16} color="#334155" />
                  </TouchableOpacity>
                  {idx < section.items.length - 1 && <View style={styles.menuDivider} />}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060C18' },
  scrollContent: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#F1F5F9', letterSpacing: -0.5 },
  settingsBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B',
    justifyContent: 'center', alignItems: 'center',
  },

  profileCard: {
    marginHorizontal: 16,
    backgroundColor: '#0B1628',
    borderRadius: 24, padding: 24,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
    marginBottom: 16,
  },

  avatarWrap: { position: 'relative', marginBottom: 16 },
  avatarGradientRing: {
    width: 108, height: 108, borderRadius: 54,
    borderWidth: 2, borderColor: '#3B82F6',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 34, fontWeight: '800', color: '#FFF' },
  editAvatarBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#3B82F6',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#0B1628',
  },

  name: { fontSize: 24, fontWeight: '800', color: '#F1F5F9', marginBottom: 4, letterSpacing: -0.3 },
  email: { fontSize: 13, color: '#64748B', marginBottom: 10 },
  joinRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 20 },
  joinText: { fontSize: 12, color: '#475569' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0F172A', borderRadius: 16, padding: 16,
    width: '100%', marginBottom: 18,
    borderWidth: 1, borderColor: '#1E293B',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '800', color: '#F1F5F9' },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  statDivider: { width: 1, height: 32, backgroundColor: '#1E293B' },

  editProfileBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 22,
    borderRadius: 22, backgroundColor: 'rgba(59,130,246,0.1)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.25)',
  },
  editProfileText: { fontSize: 14, fontWeight: '700', color: '#3B82F6' },

  interestsCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#0B1628', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)',
  },
  interestsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  interestsTitle: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
  },
  chipText: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },

  menuSection: { marginHorizontal: 16, marginBottom: 16 },
  menuSectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#475569',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#0B1628', borderRadius: 18,
    borderWidth: 1, borderColor: '#1E293B',
    overflow: 'hidden',
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: '#F1F5F9', marginBottom: 2 },
  menuSub: { fontSize: 12, color: '#64748B' },
  menuDivider: { height: 1, backgroundColor: '#1E293B', marginLeft: 72 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 8, paddingVertical: 16, borderRadius: 18,
    backgroundColor: 'rgba(220,38,38,0.07)',
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: '#DC2626' },
});
