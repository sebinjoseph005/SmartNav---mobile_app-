import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { generateTripItinerary, testBackendConnection } from '../../services/api';

export default function AIItineraryLoading() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState(
    'Analyzing 240+ local spots…'
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const generateItinerary = async () => {
      if (isGenerating) return;
      setIsGenerating(true);

      try {
        // Start progress animation
        interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) {
              return 90; // Cap at 90% until API returns
            }

            // Change text based on progress
            if (prev === 20) {
              setStepText('Fetching nearby places…');
            } else if (prev === 45) {
              setStepText('Analyzing your interests…');
            } else if (prev === 70) {
              setStepText('Creating personalized plan…');
            }

            return prev + 2;
          });
        }, 100);

        // Call backend API
        console.log('🚀 Calling backend API...');
        console.log('📍 Destination:', route.params.destination);
        console.log('💰 Budget:', route.params.budget);
        console.log('🎯 Interests:', route.params.interests);

        const result = await generateTripItinerary({
          destination: route.params.destination,
          lat: route.params.lat || 0,
          lon: route.params.lon || 0,
          fromDate: route.params.fromDate,
          toDate: route.params.toDate,
          travelers: route.params.travelers,
          budget: route.params.budget,
          currency: route.params.currency,
          interests: route.params.interests,
        });

        console.log('✅ Got result from backend:', result);

        // Complete progress
        clearInterval(interval);
        setProgress(100);
        setStepText('Finalizing your trip…');

        // Navigate to result with generated data
        setTimeout(() => {
          navigation.replace('AIItineraryResult', {
            ...route.params,
            itinerary: result.itinerary,
            isMockData: false,
          });
        }, 500);
      } catch (error: any) {
        clearInterval(interval);
        console.error('❌ ========== BACKEND API FAILED ==========');
        console.error('Error message:', error.message);
        console.error('Error type:', error.constructor.name);
        console.error('Full error:', JSON.stringify(error, null, 2));
        console.error('API URL being called:', 'https://smartnav-backend.onrender.com/api/trip/generate');
        console.error('Request params:', JSON.stringify({
          destination: route.params.destination,
          lat: route.params.lat,
          lon: route.params.lon,
          fromDate: route.params.fromDate,
          toDate: route.params.toDate,
        }, null, 2));

        // SHOW ERROR INSTEAD OF MOCK DATA
        setStepText('Failed to connect to server');

        // Navigate back with error message
        setTimeout(() => {
          alert(`Cannot connect to backend server!\n\nError: ${error.message}\n\nMake sure your phone has an internet connection.`);
          navigation.goBack();
        }, 1000);
      }
    };

    generateItinerary();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Helper to calculate days
  const calculateDays = (fromDate: string, toDate: string): number => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diff = Math.abs(to.getTime() - from.getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  // Generate mock timeline for testing
  const generateMockTimeline = (params: any) => {
    const interests = params.interests || ['History', 'Adventure'];
    const days = calculateDays(params.fromDate, params.toDate);

    const mockActivities = [
      { time: '9:00 AM', title: 'Morning Temple Visit', subtitle: 'Historical landmarks', rating: '4.5', badge: 'SafeZone', info: `₹${Math.round(params.budget * 0.1)} Entry • 2h` },
      { time: '12:00 PM', title: 'Local Food Market', subtitle: 'Traditional cuisine experience', rating: '4.3', badge: 'Popular', info: `₹${Math.round(params.budget * 0.15)} • 1.5h` },
      { time: '3:00 PM', title: interests[0] + ' Activity', subtitle: 'Based on your interests', rating: '4.6', badge: 'Recommended', info: `₹${Math.round(params.budget * 0.2)} • 2h` },
      { time: '6:00 PM', title: 'Sunset View Point', subtitle: 'Scenic location', rating: '4.8', badge: 'SafeZone', info: 'Free • 1h' },
    ];

    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      activities: mockActivities,
    }));
  };

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
