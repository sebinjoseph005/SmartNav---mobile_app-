import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* LOGO */}
      <View style={styles.logoBox}>
        <Image
          source={require('../../../assets/images/logos/logo.png')}
          style={styles.logo}
        />
      </View>

      {/* TITLE */}
      <Text style={styles.title}>SmartNav</Text>
      <Text style={styles.subtitle}>
        Beyond Booking · Intelligent · Safe · Resilient Travel
      </Text>

      {/* NEXT BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace('Onboarding')}
      >
        <Text style={styles.buttonText}>Next →</Text>
      </TouchableOpacity>

      {/* FOOTER */}
      <Text style={styles.footer}>Powered by SmartNav Ecosystem</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 88,
    height: 98,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 48,
  },
  button: {
    position: 'absolute',
    bottom: 80,
    width: '90%',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    fontSize: 12,
    color: '#64748B',
  },
});
