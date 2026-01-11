import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      {/* IMAGE */}
      <Image
        source={require('../../../assets/images/onboarding/onboarding1.png')}
        style={styles.image}
      />

      {/* TITLE */}
      <Text style={styles.title}>Smart & Safe Navigation</Text>

      {/* SUBTITLE */}
      <Text style={styles.subtitle}>
        Get route recommendations based on real-time safety data, not just speed.
      </Text>

      {/* NEXT BUTTON */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  image: {
    width: '100%',
    height: 260,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 14,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
