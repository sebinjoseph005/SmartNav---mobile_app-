import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function AIItineraryLoading() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState(
    'Analyzing 240+ local spots…'
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          navigation.replace('AIItineraryResult', {
            ...route.params,
          });
          return 100;
        }

        // Change text based on progress
        if (prev === 20) {
          setStepText('Checking safety ratings…');
        } else if (prev === 45) {
          setStepText('Optimizing routes & timing…');
        } else if (prev === 70) {
          setStepText('Personalizing itinerary…');
        } else if (prev === 90) {
          setStepText('Finalizing your trip…');
        }

        return prev + 1;
      });
    }, 80); // speed of loading

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* BOT ICON */}
      <View style={styles.botWrapper}>
        <View style={styles.ringLarge} />
        <View style={styles.ringMedium} />
        <View style={styles.botCircle}>
          <Text style={styles.botEmoji}>🤖</Text>
        </View>
      </View>

      {/* TEXT */}
      <Text style={styles.title}>Crafting your trip</Text>
      <Text style={styles.subtitle}>{stepText}</Text>

      {/* PROGRESS */}
      <View style={styles.progressWrapper}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          PROCESSING · {progress}%
        </Text>
      </View>

      <Text style={styles.note}>
        This usually takes about 10 seconds
      </Text>

      {/* CANCEL */}
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelText}>
          ✕ Cancel Generation
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  botWrapper: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },

  ringLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  ringMedium: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: '#1E40AF',
    opacity: 0.6,
  },

  botCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  botEmoji: {
    fontSize: 42,
  },

  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 28,
  },

  progressWrapper: {
    width: '100%',
    marginBottom: 12,
  },

  progressBar: {
    height: 6,
    width: '100%',
    backgroundColor: '#1F2933',
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressFill: {
    height: 6,
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },

  progressText: {
    color: '#3B82F6',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
    fontWeight: '600',
  },

  note: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 40,
  },

  cancelBtn: {
    paddingVertical: 10,
  },

  cancelText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
});
