import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { AlertTriangle, Home } from 'lucide-react-native';
import { supabase } from '../../services/supabase';

export default function EmergencySOS() {
  const navigation = useNavigation<any>();
  const [countdown, setCountdown] = useState(3);
  const [isSending, setIsSending] = useState(true);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [contactsNotified, setContactsNotified] = useState(0);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    startCountdown();
  }, []);

  useEffect(() => {
    if (countdown > 0 && isSending) {
      // Pulse animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [countdown]);

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          sendEmergencyAlert();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendEmergencyAlert = async () => {
    try {
      // Get user's emergency contact
      const { data: userData } = await supabase.auth.getUser();
      const emergencyContactName = userData?.user?.user_metadata?.emergency_contact_name;
      const emergencyContactPhone = userData?.user?.user_metadata?.emergency_contact_phone;

      if (!emergencyContactPhone) {
        Alert.alert(
          'No Emergency Contact',
          'Please add an emergency contact in your profile settings.',
          [{ text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Home' }) }]
        );
        return;
      }

      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for SOS.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Create Google Maps link
      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;

      // SMS message
      const userName = userData?.user?.user_metadata?.full_name || 'A SafeNav user';
      const message = `🚨 EMERGENCY ALERT from ${userName}!\n\nI need help. My current location:\n${mapsLink}\n\nLat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}\n\nSent via SafeNav Emergency SOS`;

      // Open SMS app with pre-filled message
      const separator = Platform.OS === 'ios' ? '&' : '?';
      const smsUrl = `sms:${emergencyContactPhone}${separator}body=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(smsUrl);
      
      if (canOpen) {
        await Linking.openURL(smsUrl);
        setContactsNotified(1);
        setSentSuccess(true);
        setIsSending(false);
      } else {
        Alert.alert(
          'SMS Not Available',
          'Unable to open SMS app. Please call your emergency contact manually.',
          [{ text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Home' }) }]
        );
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      Alert.alert(
        'Error',
        'Failed to send emergency alert. Please call your emergency contact manually.',
        [{ text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Home' }) }]
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel SOS Alert',
      'Are you sure you want to cancel the emergency alert?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: () => navigation.navigate('Main', { screen: 'Home' })
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Alert Banner */}
      <View style={styles.alertBanner}>
        <AlertTriangle size={20} color="#FFF" />
        <Text style={styles.alertText}>EMERGENCY ALERT</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {isSending ? (
          <>
            {/* Countdown Circle */}
            <Animated.View 
              style={[
                styles.countdownCircle,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <Text style={styles.countdownNumber}>{countdown}</Text>
            </Animated.View>

            {/* Status Text */}
            <Text style={styles.statusTitle}>Sending help in...</Text>
            <Text style={styles.statusSubtitle}>Keep calm, help is on the way</Text>

            {/* Location Sharing Indicator */}
            <View style={styles.sharingCard}>
              <View style={styles.sharingIcon}>
                <Text style={styles.sharingIconText}>📍</Text>
              </View>
              <View style={styles.sharingInfo}>
                <Text style={styles.sharingTitle}>📍 Sharing Live Location</Text>
                <Text style={styles.sharingTime}>Just now</Text>
              </View>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>✕ CANCEL ALERT</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Success State */}
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>

            <Text style={styles.successTitle}>Help Requested!</Text>
            <Text style={styles.successSubtitle}>
              Emergency alert sent successfully
            </Text>

            {/* Contacts Notified */}
            <View style={styles.contactsCard}>
              <View style={styles.contactsIconGroup}>
                <View style={styles.contactIconCircle}>
                  <Text style={styles.contactIconText}>👤</Text>
                </View>
              </View>
              <View style={styles.contactsInfo}>
                <Text style={styles.contactsNumber}>{contactsNotified} Contact{contactsNotified > 1 ? 's' : ''}</Text>
                <Text style={styles.contactsLabel}>NOTIFYING</Text>
              </View>
            </View>

            {/* Back to Home Button */}
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => {
                navigation.navigate('Main', { 
                  screen: 'Home',
                  params: { screen: 'HomeMain' }
                });
              }}
            >
              <Home size={20} color="#FFF" />
              <Text style={styles.homeButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DC2626', // Red emergency color
  },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },

  alertText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Countdown Circle
  countdownCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },

  countdownNumber: {
    fontSize: 120,
    fontWeight: '900',
    color: '#DC2626',
  },

  // Success Circle
  successCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },

  successIcon: {
    fontSize: 100,
    fontWeight: '900',
    color: '#16A34A',
  },

  // Status Text
  statusTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },

  statusSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
    textAlign: 'center',
  },

  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },

  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
    textAlign: 'center',
  },

  // Sharing Card
  sharingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 40,
    width: '100%',
  },

  sharingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sharingIconText: {
    fontSize: 24,
  },

  sharingInfo: {
    flex: 1,
  },

  sharingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 4,
  },

  sharingTime: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Contacts Card
  contactsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 40,
    width: '100%',
  },

  contactsIconGroup: {
    flexDirection: 'row',
  },

  contactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  contactIconText: {
    fontSize: 24,
  },

  contactsInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },

  contactsNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },

  contactsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },

  // Buttons
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 1,
  },

  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
  },

  homeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
