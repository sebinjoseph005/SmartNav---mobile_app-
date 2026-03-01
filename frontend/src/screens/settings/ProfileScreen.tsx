import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import {
  User,
  Edit3,
  Settings,
  Bell,
  Globe,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  BookMarked,
} from 'lucide-react-native';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const settingsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUser();
  }, []);

  // Reload user when screen comes into focus (e.g., after editing profile)
  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [])
  );

  // Animate settings section when toggled
  useEffect(() => {
    if (showSettings) {
      settingsAnim.setValue(0);
      Animated.spring(settingsAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      settingsAnim.setValue(0);
    }
  }, [showSettings]);

  const loadUser = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              })
            );
          },
        },
      ]
    );
  };

  const settingsOptions = [
    {
      icon: Bell,
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon'),
    },
    {
      icon: Globe,
      title: 'Language',
      subtitle: 'English',
      onPress: () => Alert.alert('Coming Soon', 'Language settings will be available soon'),
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => Alert.alert('Coming Soon', 'Help center will be available soon'),
    },
    {
      icon: FileText,
      title: 'Terms & Privacy',
      subtitle: 'Read our terms and privacy policy',
      onPress: () => Alert.alert('Coming Soon', 'Terms & Privacy will be available soon'),
    },
  ];

  const fullName = user?.user_metadata?.full_name || 'Traveler';
  const email = user?.email || 'No email';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Settings size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <TouchableOpacity
              style={styles.editAvatarBtn}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Edit3 size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{email}</Text>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Edit3 size={18} color="#3B82F6" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* SAVED TRIPS QUICK ACCESS */}
        <TouchableOpacity
          style={styles.savedTripsCard}
          onPress={() => navigation.navigate('SavedTrips')}
          activeOpacity={0.8}
        >
          <View style={styles.savedTripsIcon}>
            <BookMarked size={22} color="#2563EB" />
          </View>
          <View style={styles.savedTripsContent}>
            <Text style={styles.savedTripsTitle}>My Saved Trips</Text>
            <Text style={styles.savedTripsSubtitle}>View and manage your itineraries</Text>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* SETTINGS SECTION - Only shown when settings button is clicked */}
        {showSettings && (
          <Animated.View
            style={{
              opacity: settingsAnim,
              transform: [
                {
                  translateY: settingsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
                {
                  scale: settingsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            }}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>

              {settingsOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.settingItem}
                  onPress={option.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingIconContainer}>
                    <option.icon size={22} color="#3B82F6" />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{option.title}</Text>
                    <Text style={styles.settingSubtitle}>{option.subtitle}</Text>
                  </View>
                  <ChevronRight size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>

            {/* LOGOUT BUTTON */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <LogOut size={20} color="#DC2626" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },

  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },

  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },

  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
  },

  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0F172A',
  },

  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },

  userEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },

  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },

  editProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },

  section: {
    marginTop: 32,
    marginHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },

  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },

  settingSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },

  bottomSpacing: {
    height: 40,
  },

  savedTripsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  savedTripsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savedTripsContent: { flex: 1 },
  savedTripsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  savedTripsSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
});
